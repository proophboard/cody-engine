import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {EventQueue} from "@event-engine/infrastructure/EventQueue";
import {InMemoryStreamListenerQueue} from "@event-engine/infrastructure/Queue/InMemoryStreamListenerQueue";
import {MessageBox} from "@event-engine/messaging/message-box";
import {AuthService} from "@event-engine/infrastructure/auth-service/auth-service";
import {mapMetadataFromEventStore} from "@event-engine/infrastructure/EventStore/map-metadata-from-event-store";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";

export class PlayStreamListener {
  private readonly queue: EventQueue;
  private readonly messageBox: MessageBox;

  public constructor(es: InMemoryEventStore, stream: string, messageBox: MessageBox) {
    this.queue = new InMemoryStreamListenerQueue(es, stream);
    this.messageBox = messageBox;


    this.queue.attachConsumer(async (event) => {
      event = (await mapMetadataFromEventStore([event], getConfiguredPlayAuthService()))[0];
      return this.messageBox.eventBus.on(event);
    })
  }

  public startProcessing(): void {
    this.queue.startProcessing();
  }

  public stopProcessing(): void {
    this.queue.pause();
  }
}
