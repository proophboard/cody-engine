import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {Event, EventMeta} from "@event-engine/messaging/event";
import {MetadataMatcher} from "@event-engine/infrastructure/EventStore";

export interface MultiModelStore {
  loadEvents: <P = any, M extends EventMeta = any>(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number) => Promise<AsyncIterable<Event<P,M>>>;
  loadDoc: <D extends object>(collectionName: string, docId: string) => Promise<D | null>;
  beginSession: () => Session;
  commitSession: (session: Session) => Promise<boolean>;
}
