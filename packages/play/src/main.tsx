import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
// It's important to do this import as one of the first!
import directSetEnvEnabled from "@frontend/app/providers/enable-direct-set-env";
import App from './app/app';
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {EventMatcher} from "@event-engine/infrastructure/EventStore";
import {Action, CodyPlayConfig} from "@cody-play/state/config-store";

document.title = 'Cody Play';

(async () => {
  return new Promise<void>(resolve => {
    if(!directSetEnvEnabled) {
      throw new Error("[Cody Engine] Failed to enable direct set env");
    }

    const ds = getConfiguredPlayDocumentStore();
    const es = getConfiguredPlayEventStore();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.$CP = {
      documentStore: ds,
      eventStore: es,
      projector: {
        run: (streamName: string, eventMatcher?: EventMatcher, projectionName?: string, fromEventId?: string, limit?: number): Promise<void> => {
          throw new Error('Cody Play Config is not initialized. Please wait a moment and try again!')
        }
      },
      config: undefined, // Set in main.tsx
      dispatch: (action: Action) => { /* is overridden in config-store.ts */ }
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






