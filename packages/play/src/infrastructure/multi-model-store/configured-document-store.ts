import {Documents, InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";

let store: InMemoryDocumentStore;

export const getConfiguredPlayDocumentStore = (): InMemoryDocumentStore => {
  if(!store) {
    store = new InMemoryDocumentStore();
  }

  return store;
}
