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
import {ThemeProvider} from "@emotion/react";
import queryClient from "@frontend/http/configured-react-query";
import MainLayout from "@frontend/app/layout/MainLayout";
import React from "react";
import {pages} from "@frontend/app/pages";
import {theme} from "@frontend/app/layout/theme";

export function App() {
  const Layout = (props: React.PropsWithChildren) => {
    return <>
      <ThemeProvider theme={theme}>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </ThemeProvider>
    </>
  };

  const routeObjects: RouteObject[] = Object.values(pages).map(p => ({
    path: p.route,
    handle: {page: p},
    element: <StandardPage page={p} key={p.route}/>
  }));

  routeObjects.unshift({
    path: "/",
    loader: async () => redirect('/dashboard')
  })

  const rootRoute: RouteObject = {
    element: <Layout />,
    children: routeObjects,
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
