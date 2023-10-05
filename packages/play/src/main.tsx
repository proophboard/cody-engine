import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import {environment} from "@cody-play/environments/environment";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";

document.title = environment.appName;

(async () => {
  return new Promise<void>(resolve => {
    getConfiguredPlayDocumentStore();
    getConfiguredPlayEventStore();

    // Wait a moment, so that DS and ES can load data from local storage
    window.setTimeout(() => resolve(), 100);
  })
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






