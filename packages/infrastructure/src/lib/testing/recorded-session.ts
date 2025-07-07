import {
  DeleteDocumentTask,
  DeleteEventsTask, DeleteManyDocumentsTask,
  InsertDocumentTask,
  ReplaceDocumentTask,
  ReplaceManyDocumentsTask,
  UpdateDocumentTask,
  UpdateManyDocumentsTask,
  UpsertDocumentTask
} from "@event-engine/infrastructure/MultiModelStore/Session";
import {Event} from "@event-engine/messaging/event";
import {EventMatcher} from "@event-engine/infrastructure/EventStore";

export interface AppendEventsTask {
  streamName: string;
  events: Partial<Event>[],
  eventMatcher?: EventMatcher;
  expectedVersion?: number;
}

export interface RecordedSession {
  appendEventsTasks?: Partial<AppendEventsTask>[];
  deleteEventsTasks?: Partial<DeleteEventsTask>[];
  insertDocumentTasks?: Partial<InsertDocumentTask>[];
  upsertDocumentTasks?: Partial<UpsertDocumentTask>[];
  updateDocumentTasks?: Partial<UpdateDocumentTask>[];
  replaceDocumentTasks?: Partial<ReplaceDocumentTask>[];
  deleteDocumentTasks?: Partial<DeleteDocumentTask>[];
  updateManyDocumentsTasks?: Partial<UpdateManyDocumentsTask>[];
  replaceManyDocumentsTasks?: Partial<ReplaceManyDocumentsTask>[];
  deleteManyDocumentsTasks?: Partial<DeleteManyDocumentsTask>[];
}
