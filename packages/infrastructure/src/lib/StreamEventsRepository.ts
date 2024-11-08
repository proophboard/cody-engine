import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {InformationService} from "@event-engine/infrastructure/information-service/information-service";
import {MessageBox} from "@event-engine/messaging/message-box";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {Event, providesPublicEvent} from "@event-engine/messaging/event";
import {Command} from "@event-engine/messaging/command";
import {setMessageMetadata} from "@event-engine/messaging/message";
import {
  AggregateMeta,
  AggregateMetaKeys,
  EventMetadata,
  META_KEY_USER
} from "@event-engine/infrastructure/AggregateRepository";
import {asyncIterableToArray} from "@app/shared/utils/async-iterable-to-array";
import {mapMetadataFromEventStore} from "@event-engine/infrastructure/EventStore/map-metadata-from-event-store";

export const STREAM_AGGREGATE_TYPE = '$stream';

/**
 * The Stream Events Repository is used to save non-aggregate events (see AggregateRepository) to the event store.
 *
 * Events of a specific stream (identified by streamId) provide the same optimistic locking guarantees like aggregates,
 * but other than aggregates no internal state is maintained for the stream. It's only versioned.
 */
export class StreamEventsRepository {
  protected readonly store: MultiModelStore;
  protected readonly eventStream: string;
  protected readonly infoService: InformationService;
  protected readonly messageBox: MessageBox;
  protected readonly publicStream: string;
  protected nextSession: Session | undefined;

  constructor(
    store: MultiModelStore,
    eventStream: string,
    infoService: InformationService,
    messageBox: MessageBox,
    publicStream = "public_stream"
  ) {
    this.store = store;
    this.eventStream = eventStream;
    this.infoService = infoService;
    this.messageBox = messageBox;
    this.publicStream = publicStream;
  }

  public useSessionForNextSave(session: Session): void {
    this.nextSession = session;
  }

  public async getCurrentStreamVersion(streamId: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.store.loadEvents<any, EventMetadata>(this.eventStream, {
        'aggregateId': streamId,
        'aggregateType': STREAM_AGGREGATE_TYPE,
      }, undefined, 1, true)
        .then(async (eventsItr) => {
          const events = await asyncIterableToArray(eventsItr);

          if(events.length === 0) {
            resolve(0);
          } else {
            const latestEvent = events[0];

            resolve(latestEvent.meta.aggregateVersion);
          }
        })
    })
  }

  public async save(streamId: string, events: Event[], expectedVersion: number, command: Command): Promise<boolean> {
    let eventsCount = 0;

    const writeModelEvents: Event[] = [];
    const publicEvents: Event[] = [];

    events.forEach((evt, index) => {
      if(evt.meta.visibility === "service") {
        evt = setMessageMetadata(evt, AggregateMeta.ID, streamId);
        evt = setMessageMetadata(evt, AggregateMeta.TYPE, STREAM_AGGREGATE_TYPE);
        evt = setMessageMetadata(evt, AggregateMeta.VERSION, expectedVersion + eventsCount + 1);
        eventsCount++;
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
      session.appendEventsTo(this.eventStream, writeModelEvents, {
        'aggregateId': streamId,
        'aggregateType': STREAM_AGGREGATE_TYPE,
      }, expectedVersion)
    }

    if(publicEvents.length) {
      session.appendEventsTo(this.publicStream, publicEvents);
    }

    // Trigger live projections
    this.infoService.useSession(session);
    try {
      for (let projectionEvent of [...writeModelEvents, ...publicEvents]) {
        // Only map userId, a projection should not implicitly get access to GDPR relevant user data
        projectionEvent = (await mapMetadataFromEventStore([projectionEvent]))[0];
        await this.messageBox.eventBus.on(projectionEvent, true);
      }
      this.infoService.forgetSession();
      return await this.store.commitSession(session);
    } catch (e) {
      this.infoService.forgetSession();
      throw e;
    }
  }
}
