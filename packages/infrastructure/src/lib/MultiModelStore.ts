import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {Event, EventMeta} from "@event-engine/messaging/event";
import {MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {Payload} from "@event-engine/messaging/message";

export interface MultiModelStore {
  loadEvents: <P extends Payload = any, M extends EventMeta = any>(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number) => Promise<AsyncIterable<Event<P,M>>>;
  loadDoc: <D extends object>(collectionName: string, docId: string) => Promise<{doc: D, version: number} | null>;
  beginSession: () => Session;
  commitSession: (session: Session) => Promise<boolean>;
}
