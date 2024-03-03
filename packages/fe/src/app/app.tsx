import {QueryClientProvider} from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {StandardPage} from "@frontend/app/pages/standard-page";
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
import MainLayout from "@frontend/app/layout/MainLayout";
import React from "react";
import {pages} from "@frontend/app/pages";
import {SnackbarProvider} from "notistack";
import ScrollToTop from "@frontend/app/components/core/ScrollToTop";
import ToggleColorMode from "@frontend/app/providers/ToggleColorMode";
import User from "@frontend/app/providers/User";
import PageDataProvider from "@frontend/app/providers/PageData";
import ErrorBoundary from "@frontend/app/components/core/ErrorBoundary";

export function App() {
  const Layout = (props: React.PropsWithChildren) => {
    return <>
      <User>
        <PageDataProvider>
          <ToggleColorMode>
            <SnackbarProvider maxSnack={3} >
              <MainLayout>
                <ScrollToTop />
                <Outlet />
              </MainLayout>
            </SnackbarProvider>
          </ToggleColorMode>
        </PageDataProvider>
      </User>
    </>
  };

  const routeObjects: RouteObject[] = Object.values(pages).map(p => ({
    path: p.route,
    handle: {page: p},
    element: <StandardPage page={p} key={p.route}/>,
    errorElement: <ErrorBoundary codyEngine={true} />,
  }));

  routeObjects.unshift({
    path: "/",
    loader: async () => redirect('/dashboard')
  })

  const rootRoute: RouteObject = {
    element: <Layout />,
    children: routeObjects,
    errorElement: <ErrorBoundary codyEngine={true} />,
  }

  const router = createBrowserRouter([rootRoute]);

  return (
    <QueryClientProvider client={queryClient!}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
