import {setMessageMetadata} from "@event-engine/messaging/message";
import {Event, EventVisibility, providesPublicEvent} from "@event-engine/messaging/event";
import {Command} from "@event-engine/messaging/command";
import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {MatchOperator, MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";

interface AggregateState {
    [prop: string]: any;
}

interface AggregateStateDoc {
    state: AggregateState;
    version: number;
}

type AggregateStateFactory<S> = (state: object) => S;

export interface AggregateStateDocument<S = any> {
    state: S;
    version: number;
}

export interface EventMetadata {
    aggregateType: string;
    aggregateId: string;
    aggregateVersion: number;
    causationId: string;
    causationName: string;
    visibility: EventVisibility;
    version: string;
}

export type ApplyFunction<S> = (aggregateState: S, event: Event) => S;

export type ApplyFunctionRegistry<S> = {[eventName: string]: ApplyFunction<S>;}

export const AggregateMeta = {
    VERSION: "aggregateVersion",
    TYPE: "aggregateType",
    ID: "aggregateId",
}

export class AggregateRepository<T> {
    public readonly aggregateType: string;
    public readonly aggregateIdentifier: string;
    protected readonly store: MultiModelStore;
    protected readonly eventStream: string;
    protected readonly aggregateCollection: string;
    protected readonly applyFunctions: ApplyFunctionRegistry<T>;
    protected readonly stateFactory: AggregateStateFactory<T>;
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
        publicStream = "public_stream"
    ) {
        this.store = store;
        this.eventStream = eventStream;
        this.aggregateCollection = aggregateCollection;
        this.aggregateType = aggregateType;
        this.aggregateIdentifier = aggregateIdentifier;
        this.applyFunctions = applyFunctions;
        this.stateFactory = stateFactory;
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

        const writeModelEvents: Event[] = [];
        const publicEvents: Event[] = [];

        events.forEach((evt, index) => {
            if(evt.meta.visibility === "service") {
                evt = setMessageMetadata(evt, AggregateMeta.ID, arId);
                evt = setMessageMetadata(evt, AggregateMeta.TYPE, this.aggregateType);
                evt = setMessageMetadata(evt, AggregateMeta.VERSION, expectedVersion + aggregateEventsCount + 1);
                aggregateEventsCount++;
            }
            evt = setMessageMetadata(evt, 'causationId', command.uuid);
            evt = setMessageMetadata(evt, 'causationName', command.name);

            for (const k in command.meta) {
                evt = setMessageMetadata(evt, k, command.meta[k]);
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
            session.appendEventsTo(this.eventStream, writeModelEvents, {
                'aggregateId': arId,
                'aggregateType': this.aggregateType,
            }, expectedVersion)

            session.upsertDocument(this.aggregateCollection, arId, {
                state: aggregateState,
                version: expectedVersion + events.length,
            });
        }

        if(publicEvents.length) {
            session.appendEventsTo(this.publicStream, publicEvents);
        }

        return this.store.commitSession(session);
    }

    public async loadState(aggregateId: string, untilVersion?: number): Promise<[T, number]> {
        let maybeVersionMatcher: MetadataMatcher = {};
        let aggregateState: AggregateState = {};
        let aggregateVersion = 0;

        if(!untilVersion) {
            const doc = await this.store.loadDoc<AggregateStateDoc>(this.aggregateCollection, aggregateId);

            if(doc) {
                aggregateState = {...aggregateState, ...doc.state};
                aggregateVersion = doc.version;
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
                const events = await asyncIteratorToArray(eventsItr);

                const [finalState, finalVersion] = this.applyEvents(aggregateState as T, aggregateVersion, events);

                if(finalVersion === 0) {
                    reject(new NotFoundError(`Aggregate of type ${this.aggregateType} with id: ${aggregateId} not found.`));
                    return;
                }

                resolve([this.stateFactory(finalState as object), finalVersion]);
            });
        })
    }

    public applyEvents(arState: T, arVersion: number, events: Iterable<Event<any, EventMetadata>>): [T, number] {
        for (const evt of events) {
            if(evt.meta.visibility !== "service") {
                continue;
            }

            // eslint-disable-next-line no-prototype-builtins
            if(!this.applyFunctions.hasOwnProperty(evt.name)) {
                throw Error(`Missing aggregate apply function for event ${evt.name}`);
            }

            const applyFunc: ApplyFunction<T> = this.applyFunctions[evt.name];

            arState = applyFunc(arState, evt) as T;
            arVersion = evt.meta.aggregateVersion;
        }

        return [arState, arVersion];
    }
}
