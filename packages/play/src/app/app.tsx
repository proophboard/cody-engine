import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PlayStandardPage } from '@cody-play/app/pages/PlayStandardPage';
import {
  createBrowserRouter,
  Outlet,
  redirect,
  RouteObject,
  RouterProvider,
} from 'react-router-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import queryClient from '@frontend/extensions/http/configured-react-query';
import MainLayout from '@cody-play/app/layout/MainLayout';
import React, { useContext, useEffect, useState } from 'react';
import { SnackbarProvider } from 'notistack';
import ScrollToTop from '@frontend/app/components/core/ScrollToTop';
import User from '@frontend/app/providers/User';
import {
  addAfterDispatchListener,
  clearAfterDispatchListener,
  CodyPlayConfig,
  configStore,
  PlayConfigProvider,
} from '@cody-play/state/config-store';
import { PlayPageRegistry } from '@cody-play/state/types';
import CodyMessageServerInjection from '@cody-play/app/components/core/CodyMessageServer';
import { getConfiguredPlayEventStore } from '@cody-play/infrastructure/multi-model-store/configured-event-store';
import PlayToggleColorMode from '@cody-play/app/layout/PlayToggleColorMode';
import PendingChanges from '@cody-play/infrastructure/multi-model-store/PendingChanges';
import { getConfiguredPlayMessageBox } from '@cody-play/infrastructure/message-box/configured-message-box';
import { PlayMessageBox } from '@cody-play/infrastructure/message-box/play-message-box';
import { getConfiguredPlayReadModelProjector } from '@cody-play/infrastructure/multi-model-store/configured-play-read-model-projector';
import PageDataProvider from '@frontend/app/providers/PageData';
import ErrorBoundary from '@frontend/app/components/core/ErrorBoundary';
import { playInformationServiceFactory } from '@cody-play/infrastructure/infromation-service/play-information-service-factory';
import { TypeRegistry } from '@event-engine/infrastructure/TypeRegistry';
import GlobalStore from '@frontend/app/providers/GlobalStore';
import { getConfiguredPlayAuthService } from '@cody-play/infrastructure/auth/configured-auth-service';
import EnvProvider from '@frontend/app/providers/UseEnvironment';
import TypesProvider from '@frontend/app/providers/Types';
import { playAttachDefaultStreamListeners } from '@cody-play/infrastructure/events/play-attach-default-stream-listeners';
import {
  getPageType,
  PageDefinition,
} from '@frontend/app/pages/page-definitions';
import PlayDialogPage from '@cody-play/app/pages/PlayDialogPage';
import PlayRightDrawerPage from '@cody-play/app/pages/PlayRightDrawerPage';
import PlayToggleLiveEditMode from '@cody-play/app/layout/PlayToggleLiveEditMode';
import DragAndDrop from '@cody-play/app/providers/DragAndDrop';

let currentRoutes: string[] = [];
let messageBoxRef: PlayMessageBox;

const updateConfigAndGlobalProjector = (config: CodyPlayConfig) => {
  playInformationServiceFactory().useTypes(
    config.types as unknown as TypeRegistry
  );
  (window as any).$CP.projector = getConfiguredPlayReadModelProjector(config);
  (window as any).$CP.config = config;
};

export function App() {
  const Layout = (props: React.PropsWithChildren) => {
    return (
      <>
        <GlobalStore>
          <PlayToggleColorMode>
            <PlayToggleLiveEditMode>
              <DragAndDrop>
                <SnackbarProvider maxSnack={3}>
                  <MainLayout>
                    <ScrollToTop />
                    <Outlet />
                  </MainLayout>
                </SnackbarProvider>
              </DragAndDrop>
            </PlayToggleLiveEditMode>
          </PlayToggleColorMode>
        </GlobalStore>
      </>
    );
  };

  const { config } = useContext(configStore);
  document.title = config.appName;

  if (!messageBoxRef) {
    const es = getConfiguredPlayEventStore();
    messageBoxRef = getConfiguredPlayMessageBox(config);
    playAttachDefaultStreamListeners(es, messageBoxRef);
    updateConfigAndGlobalProjector(config);
  }

  const makeRouter = (pages: PlayPageRegistry, makeInitialRouter = false) => {
    const routeObjects: RouteObject[] = Object.keys(pages).map((pName) => {
      const p = pages[pName];
      const pType = getPageType(p as unknown as PageDefinition);
      let element: JSX.Element = <></>;

      switch (pType) {
        case 'dialog':
          element = <PlayDialogPage page={pName} key={p.route} />;
          break;
        case 'drawer':
          element = <PlayRightDrawerPage page={pName} key={p.route} />;
          break;
        default:
          element = <PlayStandardPage page={pName} key={p.route} />;
      }

      return {
        path: p.route,
        handle: { page: p },
        element,
        errorElement: <ErrorBoundary />,
      };
    });

    if (!makeInitialRouter || currentRoutes.length === 0) {
      currentRoutes = routeObjects.map((r) => r.path!);
    }

    routeObjects.unshift({
      path: '/',
      loader: async () => redirect('/welcome'),
    });

    const rootRoute: RouteObject = {
      element: <Layout />,
      children: routeObjects,
      errorElement: <ErrorBoundary />,
    };

    return createBrowserRouter([rootRoute]);
  };

  const initialRouter = makeRouter(config.pages, true);

  const [router, setRouter] = useState(initialRouter);

  useEffect(() => {
    addAfterDispatchListener((updatedState) => {
      messageBoxRef.updateConfig(updatedState, getConfiguredPlayAuthService());
      updateConfigAndGlobalProjector(updatedState);

      const newRoutes = Object.values(updatedState.pages).map((p) => p.route);

      console.log(currentRoutes, newRoutes);
      if (
        currentRoutes.length === newRoutes.length &&
        JSON.stringify(currentRoutes) === JSON.stringify(newRoutes)
      ) {
        return;
      }
      setRouter(makeRouter(updatedState.pages));
    });

    return () => {
      clearAfterDispatchListener();
    };
  });

  return (
    <QueryClientProvider client={queryClient!}>
      <EnvProvider env={{ UI_ENV: 'play', DEFAULT_SERVICE: 'App', PAGES: {} }}>
        <User>
          <PlayConfigProvider>
            <TypesProvider types={config.types as unknown as TypeRegistry}>
              <PageDataProvider>
                <CodyMessageServerInjection>
                  <PendingChanges>
                    <RouterProvider router={router} />
                  </PendingChanges>
                </CodyMessageServerInjection>
              </PageDataProvider>
            </TypesProvider>
          </PlayConfigProvider>
        </User>
      </EnvProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
