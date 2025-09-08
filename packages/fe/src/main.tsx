import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';
import {environment} from "@frontend/environments/environment";
import {bootstrapPlayFrontend} from "@frontend/playconfig/bootstrap-play-frontend";

document.title = environment.appName;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

bootstrapPlayFrontend();

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
