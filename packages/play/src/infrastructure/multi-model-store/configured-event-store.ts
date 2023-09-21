import {InMemoryEventStore, InMemoryStreamStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";

let store: InMemoryEventStore;

export const getConfiguredPlayEventStore = (): InMemoryEventStore => {
  if(!store) {
    store = new InMemoryEventStore();
  }

  return store;
}
