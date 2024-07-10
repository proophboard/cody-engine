import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {InformationService} from "@server/infrastructure/information-service/information-service";
import {MessageBox} from "@event-engine/messaging/message-box";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {Event, providesPublicEvent} from "@event-engine/messaging/event";
import {Command} from "@event-engine/messaging/command";
import {setMessageMetadata} from "@event-engine/messaging/message";
import {AggregateMeta, AggregateMetaKeys, META_KEY_USER} from "@event-engine/infrastructure/AggregateRepository";

export const NON_AGGREGATE_TYPE = '$none';

/**
 * This repository saves events as pure facts, meaning the events neither belong to a specific stream nor to an aggregate.
 *
 * Therefor, no locking strategy is applied other than duplicate events (with same uuid) are not allowed.
 */
export class PureFactsRepository {
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

  public async save(events: Event[], command: Command): Promise<boolean> {
    const writeModelEvents: Event[] = [];
    const publicEvents: Event[] = [];

    events.forEach((evt, index) => {
      if(evt.meta.visibility === "service") {
        evt = setMessageMetadata(evt, AggregateMeta.ID, evt.uuid);
        evt = setMessageMetadata(evt, AggregateMeta.TYPE, NON_AGGREGATE_TYPE);
        evt = setMessageMetadata(evt, AggregateMeta.VERSION, 1);
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
      session.appendEventsTo(this.eventStream, writeModelEvents);
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
}
