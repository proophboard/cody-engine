import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {Event, EventMeta} from "@event-engine/messaging/event";
import {Payload} from "@event-engine/messaging/message";

export class InMemoryMultiModelStore implements MultiModelStore {
  private eventStore: InMemoryEventStore;
  private documentStore: InMemoryDocumentStore;

  constructor(eventStore: InMemoryEventStore, documentStore: InMemoryDocumentStore) {
    this.eventStore = eventStore;
    this.documentStore = documentStore;
  }

  async loadEvents <P extends Payload = any, M extends EventMeta = any>(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number): Promise<AsyncIterable<Event<P,M>>> {
    return this.eventStore.load(streamName, metadataMatcher, fromEventId, limit);
  }

  async loadDoc <D extends object>(collectionName: string, docId: string): Promise<D | null> {
    return this.documentStore.getDoc(collectionName, docId);
  }

  beginSession(): Session {
    return new Session();
  }

  async commitSession(session: Session): Promise<boolean> {
    session.commit();

    session.getAppendEventsTasks().forEach(task => this.eventStore.appendTo(
      task.streamName,
      task.events,
      task.metadataMatcher,
      task.expectedVersion
    ));

    session.getDeleteEventsTasks().forEach(task => this.eventStore.delete(task.streamName, task.metadataMatcher));

    session.getUpsertDocumentTasks().forEach(task => this.documentStore.upsertDoc(
      task.collectionName,
      task.docId,
      task.doc
    ));

    session.getDeleteDocumentTasks().forEach(task => this.documentStore.deleteDoc(task.collectionName, task.docId));

    return true;
  }
}
