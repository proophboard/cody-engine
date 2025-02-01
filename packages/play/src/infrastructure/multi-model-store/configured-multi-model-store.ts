import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {InMemoryMultiModelStore} from "@event-engine/infrastructure/MultiModelStore/InMemoryMultiModelStore";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {setupSequenceProvider} from "@app/shared/jexl/sequence-extension/register";

let store: MultiModelStore;

export const getConfiguredPlayMultiModelStore = (): MultiModelStore => {
  if(!store) {
    const ds = getConfiguredPlayDocumentStore();
    store = new InMemoryMultiModelStore(getConfiguredPlayEventStore(), ds);
    setupSequenceProvider(ds);
  }

  return store;
}
