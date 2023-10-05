import {Documents, InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";

let store: InMemoryDocumentStore;

export const DOCUMENT_STORE_LOCAL_STORAGE_KEY = 'cody_play_ds_';

export const getConfiguredPlayDocumentStore = (): InMemoryDocumentStore => {
  if(!store) {
    store = new InMemoryDocumentStore();

    const savedDocsStr = localStorage.getItem(DOCUMENT_STORE_LOCAL_STORAGE_KEY + currentBoardId());

    if(savedDocsStr) {
      const docs = JSON.parse(savedDocsStr);
      console.log(`[PlayDocumentStore] Importing documents from local storage: `, docs);
      store.importDocuments(docs).catch(e => {
        throw e
      });
    }
  }

  return store;
}
