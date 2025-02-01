import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {NoOpFilesystem} from "@event-engine/infrastructure/helpers/no-op-file-system";

let store: InMemoryDocumentStore;

export const DOCUMENT_STORE_LOCAL_STORAGE_KEY = 'cody_play_ds_';

export const getConfiguredPlayDocumentStore = (): InMemoryDocumentStore => {
  if(!store) {
    store = new InMemoryDocumentStore(new NoOpFilesystem());

    const savedDocsStr = localStorage.getItem(DOCUMENT_STORE_LOCAL_STORAGE_KEY + currentBoardId());

    if(savedDocsStr) {
      let docs = JSON.parse(savedDocsStr);
      if(!docs['documents']) {
        docs = {
          documents: docs,
          sequences: {}
        }
      }

      console.log(`[PlayDocumentStore] Importing backup from local storage: `, docs);
      store.importBackup(docs).catch(e => {
        throw e
      });
    }
  }

  return store;
}
