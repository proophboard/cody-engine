import {Event} from "@event-engine/messaging/event";
import {MetadataMatcher} from "@event-engine/infrastructure/EventStore";

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
}

interface DeleteDocumentTask {
  collectionName: string;
  docId: string;
}

export class Session {
  private appendEventsTasks: AppendEventsTask[] = [];
  private deleteEventsTasks: DeleteEventsTask[] = [];
  private upsertDocumentTasks: UpsertDocumentTask[] = [];
  private deleteDocumentTasks: DeleteDocumentTask[] = [];
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

  public upsertDocument(collectionName: string, docId: string, doc: object): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot upsert document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.upsertDocumentTasks.push({collectionName, docId, doc});
  }

  public deleteDocument(collectionName: string, docId: string): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot delete document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.deleteDocumentTasks.push({collectionName, docId});
  }

  public getAppendEventsTasks(): AppendEventsTask[] {
    return [...this.appendEventsTasks];
  }

  public getDeleteEventsTasks(): DeleteEventsTask[] {
    return [...this.deleteEventsTasks];
  }

  public getUpsertDocumentTasks(): UpsertDocumentTask[] {
    return [...this.upsertDocumentTasks];
  }

  public getDeleteDocumentTasks(): DeleteDocumentTask[] {
    return [...this.deleteDocumentTasks];
  }

  public commit(): void {
    this.committed = true;
  }
}
