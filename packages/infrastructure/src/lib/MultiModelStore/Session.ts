import {Event} from "@event-engine/messaging/event";
import {MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";

interface AppendEventsTask {
  streamName: string;
  events: Event[],
  metadataMatcher?: MetadataMatcher;
  expectedVersion?: number;
}

interface DeleteEventsTask {
  streamName: string;
  metadataMatcher: MetadataMatcher;
}

interface UpsertDocumentTask {
  collectionName: string;
  docId: string;
  doc: object;
  metadata?: object;
  version?: number;
}

type InsertDocumentTask = UpsertDocumentTask;
type UpdateDocumentTask = UpsertDocumentTask;
type ReplaceDocumentTask = UpsertDocumentTask;

interface DeleteDocumentTask {
  collectionName: string;
  docId: string;
}

interface UpdateManyDocumentsTask {
  collectionName: string;
  filter: Filter;
  docOrSubset: object;
  metadata?: object;
  version?: number;
}

interface ReplaceManyDocumentsTask {
  collectionName: string;
  filter: Filter;
  doc: object;
  metadata?: object;
  version?: number;
}

interface DeleteManyDocumentsTask {
  collectionName: string;
  filter: Filter;
}

export class Session {
  private appendEventsTasks: AppendEventsTask[] = [];
  private deleteEventsTasks: DeleteEventsTask[] = [];
  private insertDocumentTasks: InsertDocumentTask[] = [];
  private upsertDocumentTasks: UpsertDocumentTask[] = [];
  private updateDocumentTasks: UpdateDocumentTask[] = [];
  private replaceDocumentTasks: ReplaceDocumentTask[] = [];
  private deleteDocumentTasks: DeleteDocumentTask[] = [];
  private updateManyDocumentsTasks: UpdateManyDocumentsTask[] = [];
  private replaceManyDocumentsTasks: ReplaceManyDocumentsTask[] = [];
  private deleteManyDocumentsTasks: DeleteManyDocumentsTask[] = [];
  private committed = false;

  public appendEventsTo(streamName: string, events: Event[], metadataMatcher?: MetadataMatcher, expectedVersion?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot append events to stream: ${streamName}. Multi-Model-Store Session is already committed.`)
    }
    this.appendEventsTasks.push({streamName, events, metadataMatcher, expectedVersion});
  }

  public deleteEventsFrom(streamName: string, metadataMatcher: MetadataMatcher): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot delete events from stream: ${streamName}. Multi-Model-Store Session is already committed.`)
    }
    this.deleteEventsTasks.push({streamName, metadataMatcher});
  }

  public insertDocument(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot insert document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.insertDocumentTasks.push({collectionName, docId, doc, metadata, version});
  }

  public upsertDocument(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot upsert document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.upsertDocumentTasks.push({collectionName, docId, doc, metadata, version});
  }

  public updateDocument(collectionName: string, docId: string, docOrSubset: object, metadata?: object, version?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot update document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.updateDocumentTasks.push({collectionName, docId, doc: docOrSubset, metadata, version});
  }

  public replaceDocument(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot replace document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.replaceDocumentTasks.push({collectionName, docId, doc, metadata, version});
  }

  public deleteDocument(collectionName: string, docId: string): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot delete document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.deleteDocumentTasks.push({collectionName, docId});
  }

  public updateManyDocuments(collectionName: string, filter: Filter, docOrSubset: object, metadata?: object, version?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot update documents in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.updateManyDocumentsTasks.push({collectionName, filter, docOrSubset, metadata, version});
  }

  public replaceManyDocuments(collectionName: string, filter: Filter, doc: object, metadata?: object, version?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot replace documents in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.replaceManyDocumentsTasks.push({collectionName, filter, doc, metadata, version});
  }

  public deleteManyDocuments(collectionName: string, filter: Filter): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot delete documents in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.deleteManyDocumentsTasks.push({collectionName, filter});
  }

  public getAppendEventsTasks(): AppendEventsTask[] {
    return [...this.appendEventsTasks];
  }

  public getDeleteEventsTasks(): DeleteEventsTask[] {
    return [...this.deleteEventsTasks];
  }

  public getInsertDocumentTasks(): InsertDocumentTask[] {
    return [...this.insertDocumentTasks];
  }

  public getUpsertDocumentTasks(): UpsertDocumentTask[] {
    return [...this.upsertDocumentTasks];
  }

  public getUpdateDocumentTasks(): UpdateDocumentTask[] {
    return [...this.updateDocumentTasks];
  }

  public getReplaceDocumentTasks(): ReplaceDocumentTask[] {
    return [...this.replaceDocumentTasks];
  }

  public getDeleteDocumentTasks(): DeleteDocumentTask[] {
    return [...this.deleteDocumentTasks];
  }

  public getUpdateManyDocumentsTasks(): UpdateManyDocumentsTask[] {
    return [...this.updateManyDocumentsTasks];
  }

  public getReplaceManyDocumentsTasks(): ReplaceManyDocumentsTask[] {
    return [...this.replaceManyDocumentsTasks];
  }

  public getDeleteManyDocumentsTasks(): DeleteManyDocumentsTask[] {
    return [...this.deleteManyDocumentsTasks];
  }

  public commit(): void {
    this.committed = true;
  }
}
