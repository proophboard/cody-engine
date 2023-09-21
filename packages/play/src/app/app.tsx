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
import ToggleColorMode from "@frontend/app/providers/ToggleColorMode";
import User from "@frontend/app/providers/User";
import {addAfterDispatchListener, clearAfterDispatchListener, PlayConfigProvider, configStore} from "@cody-play/state/config-store";
import {PlayPageRegistry} from "@cody-play/state/types";

let currentRoutes: string[] = [];

export function App() {
  const Layout = (props: React.PropsWithChildren) => {
    return <>
      <PlayConfigProvider>
        <User>
          <ToggleColorMode>
            <SnackbarProvider maxSnack={3} >
              <MainLayout>
                <ScrollToTop />
                <Outlet />
              </MainLayout>
            </SnackbarProvider>
          </ToggleColorMode>
        </User>
      </PlayConfigProvider>
    </>
  };

  const {config} = useContext(configStore);

  const makeRouter = (pages: PlayPageRegistry) => {
    const routeObjects: RouteObject[] = Object.values(pages).map(p => ({
      path: p.route,
      handle: {page: p},
      element: <PlayStandardPage page={p} key={p.route}/>
    }));

    currentRoutes = routeObjects.map(r => r.path!);

    routeObjects.unshift({
      path: "/",
      loader: async () => redirect('/dashboard')
    })

    const rootRoute: RouteObject = {
      element: <Layout />,
      children: routeObjects,
    }

    return createBrowserRouter([rootRoute]);
  }

  const initialRouter = makeRouter(config.pages);

  const [router, setRouter] = useState(initialRouter);

  useEffect(() => {
    addAfterDispatchListener((updatedState) => {
      const newRoutes = Object.values(updatedState.pages).map(p => p.route);

      if(currentRoutes.length === newRoutes.length && JSON.stringify(currentRoutes) === JSON.stringify(newRoutes)) {
        return;
      }
      console.log("new router: ", updatedState.pages);
      setRouter(makeRouter(updatedState.pages));
    })

    return () => {clearAfterDispatchListener()}
  })

  return (
    <QueryClientProvider client={queryClient!}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
