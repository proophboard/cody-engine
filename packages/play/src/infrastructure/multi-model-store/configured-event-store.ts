import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";

let store: InMemoryEventStore;

export const EVENT_STORE_LOCAL_STORAGE_KEY = 'cody_play_es_';

export const getConfiguredPlayEventStore = (): InMemoryEventStore => {
  if(!store) {
    store = new InMemoryEventStore();

    const savedStreamsStr = localStorage.getItem(EVENT_STORE_LOCAL_STORAGE_KEY + currentBoardId());

    if(savedStreamsStr) {
      const streams = JSON.parse(savedStreamsStr);
      console.log(`[PlayEventStore] Importing streams from local storage: `, streams);
      store.importStreams(streams).catch(e => {
        throw e
      })
    }
  }

  return store;
}


