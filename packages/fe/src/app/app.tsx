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

// Verspielt
import '@fontsource/pacifico/400.css'; 
import '@fontsource/baloo-2/400.css'; 
import '@fontsource/caveat/400.css'; 

// Schlicht
import '@fontsource/open-sans/400.css'; 
import '@fontsource/lato/400.css'; 
import '@fontsource/montserrat/400.css'; 

// Maschinell
import '@fontsource/roboto-mono/400.css'; 
import '@fontsource/source-code-pro/400.css'; 
import '@fontsource/fira-code/400.css';

// Gerundet
import '@fontsource/nunito/400.css'; 
import '@fontsource/quicksand/400.css'; 
import '@fontsource/comic-neue/400.css'; 

// Elegant
import '@fontsource/playfair-display/400.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/abril-fatface/400.css';

// Dramatisch
import '@fontsource/bebas-neue/400.css';
import '@fontsource/righteous/400.css';
import '@fontsource/bungee/400.css'; 

// Sachlich
import '@fontsource/roboto/400.css'; 
import '@fontsource/inter/400.css';
import '@fontsource/ubuntu/400.css';

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
