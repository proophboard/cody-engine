import {Event} from "@event-engine/messaging/event";
import {MetadataMatcher} from "@event-engine/infrastructure/EventStore";

interface AppendEventsTask {
  streamName: string;
  events: Event[],
  metadataMatcher?: MetadataMatcher;
  expectedVersion?: number;
}

interface UpsertDocumentTask {
  collectionName: string;
  docId: string;
  doc: object;
}

export class Session {
  private appendEventsTasks: AppendEventsTask[] = [];
  private upsertDocumentTasks: UpsertDocumentTask[] = [];
  private committed = false;

  public appendEventsTo(streamName: string, events: Event[], metadataMatcher?: MetadataMatcher, expectedVersion?: number): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot append events to stream: ${streamName}. Multi-Model-Store Session is already committed.`)
    }
    this.appendEventsTasks.push({streamName, events, metadataMatcher, expectedVersion});
  }

  public upsertDocument(collectionName: string, docId: string, doc: object): void {
    if(this.committed) {
      throw new Error(`[DB] Cannot upsert document (${docId}) in collection: ${collectionName}. Multi-Model-Store Session is already committed.`)
    }
    this.upsertDocumentTasks.push({collectionName, docId, doc});
  }

  public getAppendEventsTasks(): AppendEventsTask[] {
    return [...this.appendEventsTasks];
  }

  public getUpsertDocumentTasks(): UpsertDocumentTask[] {
    return [...this.upsertDocumentTasks];
  }

  public commit(): void {
    this.committed = true;
  }
}
