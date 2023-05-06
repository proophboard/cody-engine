import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {getConfiguredEventStore} from "@server/infrastructure/configuredEventStore";
import {getConfiguredDocumentStore} from "@server/infrastructure/configuredDocumentStore";
import {PostgresDocumentStore} from "@event-engine/infrastructure/DocumentStore/PostgresDocumentStore";
import {getConfiguredDB} from "@server/infrastructure/configuredDB";
import {PostgresMultiModelStore} from "@event-engine/infrastructure/MultiModelStore/PostgresMultiModelStore";
import {PostgresEventStore} from "@event-engine/infrastructure/EventStore/PostgresEventStore";
import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {InMemoryMultiModelStore} from "@event-engine/infrastructure/MultiModelStore/InMemoryMultiModelStore";
import {env} from "@server/environments/environment.current";

let store: MultiModelStore;

export const getConfiguredMultiModelStore = () => {
  if(!store) {
    const es = getConfiguredEventStore();
    const ds = getConfiguredDocumentStore();

    if(env.eventStore.adapter === "postgres" && env.documentStore.adapter === "postgres") {
      if(!(es instanceof PostgresEventStore)) {
        throw new Error("Postgres MultiModelStore requires an instance of PostgresEventStore, but another EventStore is given.");
      }

      if(!(ds instanceof PostgresDocumentStore)) {
        throw new Error("Postgres MultiModelStore requires an instance of PostgresDocumentStore, but another DocumentStore is given.");
      }

      store = new PostgresMultiModelStore(
        getConfiguredDB(),
        es,
        ds
      )
    } else {
      if(!(es instanceof InMemoryEventStore)) {
        throw new Error("InMemory MultiModelStore requires an instance of InMemoryEventStore, but another EventStore is given.");
      }

      if(!(ds instanceof InMemoryDocumentStore)) {
        throw new Error("InMemory MultiModelStore requires an instance of InMemoryDocumentStore, but another DocumentStore is given.");
      }

      store = new InMemoryMultiModelStore(
        es,
        ds
      )
    }
  }

  return store;
}
