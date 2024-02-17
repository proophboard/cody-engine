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

  async loadDoc <D extends object>(collectionName: string, docId: string): Promise<{doc: D, version: number} | null> {
    return this.documentStore.getDocAndVersion(collectionName, docId);
  }

  beginSession(): Session {
    return new Session();
  }

  async commitSession(session: Session): Promise<boolean> {
    session.commit();

    const currentStreams = await this.eventStore.exportStreams();
    const currentDocuments = await this.documentStore.exportDocuments();

    this.eventStore.disableDiskStorage();
    this.documentStore.disableDiskStorage();

    try {
      for (const appendEventsTask of session.getAppendEventsTasks()) {
        await this.eventStore.appendTo(
          appendEventsTask.streamName,
          appendEventsTask.events,
          appendEventsTask.metadataMatcher,
          appendEventsTask.expectedVersion
        )
      }

      for (const deleteEventsTask of session.getDeleteEventsTasks()) {
        await this.eventStore.delete(deleteEventsTask.streamName, deleteEventsTask.metadataMatcher);
      }

      for (const insertDocumentTask of session.getInsertDocumentTasks()) {
        await this.documentStore.addDoc(
          insertDocumentTask.collectionName,
          insertDocumentTask.docId,
          insertDocumentTask.doc,
          insertDocumentTask.metadata,
          insertDocumentTask.version
        )
      }

      for (const upsertDocumentTask of session.getUpsertDocumentTasks()) {
        await this.documentStore.upsertDoc(
          upsertDocumentTask.collectionName,
          upsertDocumentTask.docId,
          upsertDocumentTask.doc,
          upsertDocumentTask.metadata,
          upsertDocumentTask.version
        )
      }

      for (const updateDocumentTask of session.getUpdateDocumentTasks()) {
        await this.documentStore.updateDoc(
          updateDocumentTask.collectionName,
          updateDocumentTask.docId,
          updateDocumentTask.doc,
          updateDocumentTask.metadata,
          updateDocumentTask.version
        )
      }

      for (const updateManyDocumentsTask of session.getUpdateManyDocumentsTasks()) {
        await this.documentStore.updateMany(
          updateManyDocumentsTask.collectionName,
          updateManyDocumentsTask.filter,
          updateManyDocumentsTask.docOrSubset,
          updateManyDocumentsTask.metadata,
          updateManyDocumentsTask.version
        )
      }

      for (const replaceDocumentTask of session.getReplaceDocumentTasks()) {
        await this.documentStore.replaceDoc(
          replaceDocumentTask.collectionName,
          replaceDocumentTask.docId,
          replaceDocumentTask.doc,
          replaceDocumentTask.metadata,
          replaceDocumentTask.version
        )
      }

      for (const replaceManyDocumentsTask of session.getReplaceManyDocumentsTasks()) {
        await this.documentStore.replaceMany(
          replaceManyDocumentsTask.collectionName,
          replaceManyDocumentsTask.filter,
          replaceManyDocumentsTask.doc,
          replaceManyDocumentsTask.metadata,
          replaceManyDocumentsTask.version
        )
      }

      for (const deleteDocumentTask of session.getDeleteDocumentTasks()) {
        await this.documentStore.deleteDoc(deleteDocumentTask.collectionName, deleteDocumentTask.docId);
      }

      for (const deleteManyDocumentsTask of session.getDeleteManyDocumentsTasks()) {
        await this.documentStore.deleteMany(
          deleteManyDocumentsTask.collectionName,
          deleteManyDocumentsTask.filter
        )
      }

      this.eventStore.enableDiskStorage();
      this.documentStore.enableDiskStorage();
      this.documentStore.flush();
      this.eventStore.flush();
    } catch (e) {
      await this.eventStore.importStreams(currentStreams);
      await this.documentStore.importDocuments(currentDocuments);
      this.eventStore.enableDiskStorage();
      this.documentStore.enableDiskStorage();
      throw e;
    }

    return true;
  }
}
