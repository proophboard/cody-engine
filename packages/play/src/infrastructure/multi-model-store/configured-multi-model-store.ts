import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {InMemoryMultiModelStore} from "@event-engine/infrastructure/MultiModelStore/InMemoryMultiModelStore";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";

let store: MultiModelStore;

export const getConfiguredPlayMultiModelStore = (): MultiModelStore => {
  if(!store) {
    store = new InMemoryMultiModelStore(getConfiguredPlayEventStore(), getConfiguredPlayDocumentStore());
  }

  return store;
}
