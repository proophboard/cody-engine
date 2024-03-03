import {QueryClientProvider} from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {PlayStandardPage} from "@cody-play/app/pages/play-standard-page";
import {
  createBrowserRouter,
  RouteObject,
  Outlet,
  RouterProvider,
  redirect
} from "react-router-dom";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import queryClient from "@frontend/extensions/http/configured-react-query";
import MainLayout from "@cody-play/app/layout/MainLayout";
import React, {useContext, useEffect, useState} from "react";
import {SnackbarProvider} from "notistack";
import ScrollToTop from "@frontend/app/components/core/ScrollToTop";
import User from "@frontend/app/providers/User";
import {
  addAfterDispatchListener,
  clearAfterDispatchListener,
  PlayConfigProvider,
  configStore,
  CodyPlayConfig, Action
} from "@cody-play/state/config-store";
import {PlayPageRegistry} from "@cody-play/state/types";
import CodyMessageServerInjection from "@cody-play/app/components/core/CodyMessageServer";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {PlayStreamListener} from "@cody-play/infrastructure/multi-model-store/make-stream-listener";
import PlayToggleColorMode from "@cody-play/app/layout/PlayToggleColorMode";
import PendingChanges from "@cody-play/infrastructure/multi-model-store/PendingChanges";
import {getConfiguredPlayMessageBox} from "@cody-play/infrastructure/message-box/configured-message-box";
import {PlayMessageBox} from "@cody-play/infrastructure/message-box/play-message-box";
import {
  getConfiguredPlayReadModelProjector
} from "@cody-play/infrastructure/multi-model-store/configured-play-read-model-projector";
import PageDataProvider from "@frontend/app/providers/PageData";
import ErrorBoundary from "@frontend/app/components/core/ErrorBoundary";

let currentRoutes: string[] = [];
let messageBoxRef: PlayMessageBox;

const updateConfigAndGlobalProjector = (config: CodyPlayConfig) => {
  (window as any).$CP.projector = getConfiguredPlayReadModelProjector(config);
  (window as any).$CP.config = config;
}

export function App() {
  const Layout = (props: React.PropsWithChildren) => {
    return <>
      <PlayToggleColorMode>
        <SnackbarProvider maxSnack={3}>
          <MainLayout>
            <ScrollToTop />
              <Outlet />
          </MainLayout>
        </SnackbarProvider>
      </PlayToggleColorMode>
    </>
  };

  const {config} = useContext(configStore);

  document.title = config.appName;

  if(!messageBoxRef) {
    const es = getConfiguredPlayEventStore();
    messageBoxRef = getConfiguredPlayMessageBox(config);
    const PublicStreamListener = new PlayStreamListener(es, 'public_stream', messageBoxRef);
    PublicStreamListener.startProcessing();

    const writeModelStreamListener = new PlayStreamListener(es, 'write_model_stream', messageBoxRef);
    writeModelStreamListener.startProcessing();
    updateConfigAndGlobalProjector(config);
  }

  const makeRouter = (pages: PlayPageRegistry, makeInitialRouter = false) => {
    const routeObjects: RouteObject[] = Object.keys(pages).map(pName => {
      const p = pages[pName];

      return {
        path: p.route,
        handle: {page: p},
        element: <PlayStandardPage page={pName} key={p.route}/>,
        errorElement: <ErrorBoundary />
      }
    });

    if (!makeInitialRouter || currentRoutes.length === 0) {
      currentRoutes = routeObjects.map(r => r.path!);
    }

    routeObjects.unshift({
      path: "/",
      loader: async () => redirect('/dashboard')
    })

    const rootRoute: RouteObject = {
      element: <Layout />,
      children: routeObjects,
      errorElement: <ErrorBoundary />
    }

    return createBrowserRouter([rootRoute]);
  }

  const initialRouter = makeRouter(config.pages, true);

  const [router, setRouter] = useState(initialRouter);

  useEffect(() => {
    addAfterDispatchListener((updatedState) => {
      const newRoutes = Object.values(updatedState.pages).map(p => p.route);

      console.log(currentRoutes, newRoutes);
      if(currentRoutes.length === newRoutes.length && JSON.stringify(currentRoutes) === JSON.stringify(newRoutes)) {
        return;
      }
      setRouter(makeRouter(updatedState.pages));

      messageBoxRef.updateConfig(updatedState);
      updateConfigAndGlobalProjector(updatedState);
    })

    return () => {
      clearAfterDispatchListener();
    }
  })

  return (
    <QueryClientProvider client={queryClient!}>
      <User>
        <PlayConfigProvider>
          <PageDataProvider>
            <CodyMessageServerInjection>
              <PendingChanges>
                <RouterProvider router={router} />
              </PendingChanges>
            </CodyMessageServerInjection>
          </PageDataProvider>
        </PlayConfigProvider>
      </User>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
