import {DocumentStore} from "@event-engine/infrastructure/DocumentStore";
import {PostgresDocumentStore} from "@event-engine/infrastructure/DocumentStore/PostgresDocumentStore";
import {getConfiguredDB} from "@server/infrastructure/configuredDB";
import {env} from "@server/env";
import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";

let store: DocumentStore;

export const PERSISTENT_COLLECTION_FILE = process.cwd() + '/../../../data/persistent-collections.json';

export const getConfiguredDocumentStore = (): DocumentStore => {
  if(!store) {
    switch (env.documentStore.adapter) {
      case "postgres":
        store = new PostgresDocumentStore(getConfiguredDB());
        break;
      case "filesystem":
        store = new InMemoryDocumentStore(PERSISTENT_COLLECTION_FILE);
        break;
      default:
        store = new InMemoryDocumentStore();
    }
  }

  return store;
}
