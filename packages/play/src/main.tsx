import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import {environment} from "@cody-play/environments/environment";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {Documents} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";

document.title = environment.appName;

const docs: Documents = {
  brand_collection: {
    "c0b3a071-5f72-4211-8db8-1c5bb287159a": {
      "state": {
        "brandId": "c0b3a071-5f72-4211-8db8-1c5bb287159a",
        "name": "Audi"
      },
      "version": 1
    },
    "ed63587e-834f-492b-8f2e-4daf8788f1ca": {
      "state": {
        "brandId": "ed63587e-834f-492b-8f2e-4daf8788f1ca",
        "name": "Volkswagen"
      },
      "version": 1
    },
    "8a9b68af-3461-4f0b-af0e-a058cf0a0dc4": {
      "state": {
        "brandId": "8a9b68af-3461-4f0b-af0e-a058cf0a0dc4",
        "name": "Seat"
      },
      "version": 1
    },
    "97715735-4113-4629-a35f-2d1b92fe2e8b": {
      "state": {
        "brandId": "97715735-4113-4629-a35f-2d1b92fe2e8b",
        "name": "Fiat"
      },
      "version": 1
    },
    "7f2865cc-c1ef-4d8b-949d-cca573093430": {
      "state": {
        "brandId": "7f2865cc-c1ef-4d8b-949d-cca573093430",
        "name": "Renault"
      },
      "version": 1
    },
    "7600995e-ae5d-4f4a-aa4e-4c1873a5b72d": {
      "state": {
        "brandId": "7600995e-ae5d-4f4a-aa4e-4c1873a5b72d",
        "name": "Dodge"
      },
      "version": 1
    },
    "d211e994-8fcc-4078-b9a8-37b816759c0a": {
      "state": {
        "brandId": "d211e994-8fcc-4078-b9a8-37b816759c0a",
        "name": "Chevrolet"
      },
      "version": 1
    },
    "171dd379-6cf5-43f5-943b-6780c5937064": {
      "state": {
        "brandId": "171dd379-6cf5-43f5-943b-6780c5937064",
        "name": "Volvo"
      },
      "version": 1
    },
    "72c63632-cd57-46a9-826c-6f5755c8cbe9": {
      "state": {
        "brandId": "72c63632-cd57-46a9-826c-6f5755c8cbe9",
        "name": "Land Rover"
      },
      "version": 1
    },
    "247dac09-9c6e-462f-ad55-42fafa05ccb1": {
      "state": {
        "brandId": "247dac09-9c6e-462f-ad55-42fafa05ccb1",
        "name": "Skoda"
      },
      "version": 1
    }
  }
};

(async () => {
  await getConfiguredPlayDocumentStore().importDocuments(docs);

  const es = getConfiguredPlayEventStore();
})().then(() => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
})






