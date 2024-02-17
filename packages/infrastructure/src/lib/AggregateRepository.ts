import {setMessageMetadata} from "@event-engine/messaging/message";
import {Event, EventVisibility, providesPublicEvent} from "@event-engine/messaging/event";
import {Command} from "@event-engine/messaging/command";
import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {MatchOperator, MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {makeValueObject} from "@event-engine/messaging/value-object";
import {AuthService} from "@server/infrastructure/auth-service/auth-service";
import {InformationService} from "@server/infrastructure/information-service/information-service";
import {MessageBox} from "@event-engine/messaging/message-box";

interface AggregateState {
    [prop: string]: any;
}

interface AggregateStateDoc {
    state: AggregateState;
    version: number;
}

type AggregateStateFactory<T extends object = any> = ReturnType<typeof makeValueObject<T>>;

export interface AggregateStateDocument<S = any> {
    state: S;
    version: number;
}

export const META_KEY_DELETE_STATE = 'ceDeleteState';
export const META_KEY_DELETE_HISTORY = 'ceDeleteHistory';
export const META_KEY_USER = 'user';

export interface EventMetadata {
    aggregateType: string;
    aggregateId: string;
    aggregateVersion: number;
    causationId: string;
    causationName: string;
    visibility: EventVisibility;
    version: string;
    ceDeleteState?: boolean;
    ceDeleteHistory?: boolean;
}

export type ApplyFunction<S> = (aggregateState: S, event: Event) => Promise<S>;

export type ApplyFunctionRegistry<S> = {[eventName: string]: ApplyFunction<S>;}

export const AggregateMeta = {
    VERSION: "aggregateVersion",
    TYPE: "aggregateType",
    ID: "aggregateId",
}

export const AggregateMetaKeys = [AggregateMeta.VERSION, AggregateMeta.TYPE, AggregateMeta.ID];

export class AggregateRepository<T extends object = any> {
    public readonly aggregateType: string;
    public readonly aggregateIdentifier: string;
    protected readonly store: MultiModelStore;
    protected readonly eventStream: string;
    protected readonly aggregateCollection: string;
    protected readonly applyFunctions: ApplyFunctionRegistry<T>;
    protected readonly stateFactory: AggregateStateFactory<T>;
    protected readonly authService: AuthService;
    protected readonly infoService: InformationService;
    protected readonly messageBox: MessageBox;
    protected readonly publicStream: string;
    protected nextSession: Session | undefined;

    constructor(
        store: MultiModelStore,
        eventStream: string,
        aggregateCollection: string,
        aggregateType: string,
        aggregateIdentifier: string,
        applyFunctions: {[eventName: string]: ApplyFunction<T>},
        stateFactory: AggregateStateFactory<T>,
        authService: AuthService,
        infoService: InformationService,
        messageBox: MessageBox,
        publicStream = "public_stream"
    ) {
        this.store = store;
        this.eventStream = eventStream;
        this.aggregateCollection = aggregateCollection;
        this.aggregateType = aggregateType;
        this.aggregateIdentifier = aggregateIdentifier;
        this.applyFunctions = applyFunctions;
        this.stateFactory = stateFactory;
        this.authService = authService;
        this.infoService = infoService;
        this.messageBox = messageBox;
        this.publicStream = publicStream;
    }

    public useSessionForNextSave(session: Session): void {
        this.nextSession = session;
    }

    public async save(events: Event[], aggregateState: Readonly<AggregateState>, expectedVersion: number, command: Command): Promise<boolean> {
        // eslint-disable-next-line no-prototype-builtins
        if(!aggregateState.hasOwnProperty(this.aggregateIdentifier)) {
            throw Error(`Missing aggregate identifier "${this.aggregateIdentifier}" in aggregate state: ` + JSON.stringify(aggregateState));
        }

        const arId = aggregateState[this.aggregateIdentifier];
        let aggregateEventsCount = 0;
        let deleteState = false;
        let deleteHistory = false;

        const writeModelEvents: Event[] = [];
        const publicEvents: Event[] = [];

        events.forEach((evt, index) => {
            if(evt.meta.visibility === "service") {
                evt = setMessageMetadata(evt, AggregateMeta.ID, arId);
                evt = setMessageMetadata(evt, AggregateMeta.TYPE, this.aggregateType);
                evt = setMessageMetadata(evt, AggregateMeta.VERSION, expectedVersion + aggregateEventsCount + 1);
                aggregateEventsCount++;

                if(evt.meta.ceDeleteState) {
                    deleteState = true;
                }

                if(evt.meta.ceDeleteHistory) {
                    deleteHistory = true;
                }
            }

            evt = setMessageMetadata(evt, 'causationId', command.uuid);
            evt = setMessageMetadata(evt, 'causationName', command.name);

            for (const k in command.meta) {
                if(AggregateMetaKeys.includes(k)) {
                    continue;
                }
                evt = setMessageMetadata(evt, k, command.meta[k]);
            }

            if(evt.meta.user && typeof evt.meta.user === 'object' && evt.meta.user.userId) {
                evt = setMessageMetadata(evt, META_KEY_USER, evt.meta.user.userId);
            }

            if(evt.meta.visibility === "service") {
                writeModelEvents.push(evt);

                if(providesPublicEvent(evt)) {
                    publicEvents.push(evt.toPublicEvent());
                }
            } else {
                publicEvents.push(evt);
            }

            events[index] = evt;
        });

        const session = this.nextSession || this.store.beginSession();

        this.nextSession = undefined;

        if(writeModelEvents.length) {
            if(deleteHistory) {
                session.deleteEventsFrom(this.eventStream, {
                    'aggregateId': arId,
                    'aggregateType': this.aggregateType,
                });
            } else {
                session.appendEventsTo(this.eventStream, writeModelEvents, {
                    'aggregateId': arId,
                    'aggregateType': this.aggregateType,
                }, expectedVersion)
            }

            if(deleteState) {
                session.deleteDocument(this.aggregateCollection, arId);
            } else {
                session.upsertDocument(this.aggregateCollection, arId, aggregateState, undefined, expectedVersion + events.length);
            }
        }

        if(publicEvents.length) {
            session.appendEventsTo(this.publicStream, publicEvents);
        }

        // Trigger live projections
        this.infoService.useSession(session);
        try {
            for (const projectionEvent of [...writeModelEvents, ...publicEvents]) {
                await this.messageBox.eventBus.on(projectionEvent, true);
            }
            this.infoService.forgetSession();
            return await this.store.commitSession(session);
        } catch (e) {
            this.infoService.forgetSession();
            throw e;
        }
    }

    public async loadState(aggregateId: string, untilVersion?: number): Promise<[T, number]> {
        let maybeVersionMatcher: MetadataMatcher = {};
        let aggregateState: AggregateState = {};
        let aggregateVersion = 0;

        if(!untilVersion) {
            const docAndVersion = await this.store.loadDoc<AggregateStateDoc>(this.aggregateCollection, aggregateId);

            if(docAndVersion) {
                aggregateState = {...aggregateState, ...docAndVersion.doc};
                aggregateVersion = docAndVersion.version;
                maybeVersionMatcher = {'aggregateVersion': {op: MatchOperator.GT, val: aggregateVersion}};
            }
        } else {
            maybeVersionMatcher = {'aggregateVersion': {op: MatchOperator.LTE, val: untilVersion}};
        }

        return new Promise<[T, number]>((resolve, reject) => {
            this.store.loadEvents<any, EventMetadata>(this.eventStream, {
                'aggregateId': aggregateId,
                'aggregateType': this.aggregateType,
                ...maybeVersionMatcher
            }).then(async (eventsItr) => {
                const events = await this.mapMetadataFromStore(await asyncIteratorToArray(eventsItr));

                const [finalState, finalVersion] = await this.applyEvents(aggregateState as T, aggregateVersion, events);

                if(finalVersion === 0) {
                    reject(new NotFoundError(`Aggregate of type ${this.aggregateType} with id: ${aggregateId} not found.`));
                    return;
                }

                resolve([this.stateFactory(finalState), finalVersion]);
            });
        })
    }

    public async applyEvents(arState: T, arVersion: number, events: Iterable<Event<any, EventMetadata>>): Promise<[T, number]> {
        for (const evt of events) {
            if(evt.meta.visibility !== "service") {
                continue;
            }

            // eslint-disable-next-line no-prototype-builtins
            if(!this.applyFunctions.hasOwnProperty(evt.name)) {
                throw Error(`Missing aggregate apply function for event ${evt.name}`);
            }

            const applyFunc: ApplyFunction<T> = this.applyFunctions[evt.name];

            arState = await applyFunc(arState, evt) as T;
            // This will trigger a not found error if this is the last event
            arVersion = evt.meta.ceDeleteState ? 0 : evt.meta.aggregateVersion;
        }

        return [arState, arVersion];
    }

    protected async mapMetadataFromStore(events: Event[]): Promise<Event[]> {
        const mappedEvents: Event[] = [];

        for (let event of events) {
            if(event.meta.user && typeof event.meta.user === 'string') {
                event = setMessageMetadata(event, META_KEY_USER, await this.authService.get(event.meta.user));
            }

            mappedEvents.push(event);
        }

        return mappedEvents;
    }
}
