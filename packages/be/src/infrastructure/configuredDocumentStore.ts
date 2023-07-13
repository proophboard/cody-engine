import {DocumentStore} from "@event-engine/infrastructure/DocumentStore";
import {PostgresDocumentStore} from "@event-engine/infrastructure/DocumentStore/PostgresDocumentStore";
import {getConfiguredDB} from "@server/infrastructure/configuredDB";
import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {env} from "@server/environments/environment.current";

let store: DocumentStore;

const path = process.cwd() === '/app' ? '/data' : '/../../data';

export const PERSISTENT_COLLECTION_FILE = process.cwd() + path + '/persistent-collections.json';

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
