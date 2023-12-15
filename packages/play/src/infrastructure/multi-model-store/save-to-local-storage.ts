import {CodyPlayConfig} from "@cody-play/state/config-store";
import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {DOCUMENT_STORE_LOCAL_STORAGE_KEY} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {EVENT_STORE_LOCAL_STORAGE_KEY} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {saveConfigToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-config-to-local-storage";

export const saveToLocalStorage = async (config: CodyPlayConfig, ds: InMemoryDocumentStore, es: InMemoryEventStore, boardId: string) => {
  saveConfigToLocalStorage(config, boardId);
  await saveDataToLocalStorage(ds, es, boardId);
}

export const saveDataToLocalStorage = async (ds: InMemoryDocumentStore, es: InMemoryEventStore, boardId: string) => {
  localStorage.setItem(DOCUMENT_STORE_LOCAL_STORAGE_KEY + boardId, JSON.stringify(await ds.exportDocuments()));
  localStorage.setItem(EVENT_STORE_LOCAL_STORAGE_KEY + boardId, JSON.stringify(await es.exportStreams()));
}
