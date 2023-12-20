import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";

document.title = 'Cody Play';

(async () => {
  return new Promise<void>(resolve => {
    const ds = getConfiguredPlayDocumentStore();
    const es = getConfiguredPlayEventStore();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.$CP = {
      ds,
      es
    }

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






