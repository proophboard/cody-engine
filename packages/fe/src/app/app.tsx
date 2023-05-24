import {QueryClientProvider} from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {StandardPage} from "@frontend/app/pages/standard-page";
import {Route, Routes} from "react-router-dom";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {createTheme} from "@mui/material";
import {ThemeProvider} from "@emotion/react";
import queryClient from "@frontend/http/configured-react-query";
import MainLayout from "@frontend/app/layout/MainLayout";
import React from "react";
import {pages} from "@frontend/app/pages";

const theme = createTheme({});

export function App() {
  const Layout = (props: React.PropsWithChildren) => {
    return <>
      <ThemeProvider theme={theme}>
        <MainLayout>
          {props.children}
        </MainLayout>
      </ThemeProvider>
    </>
  };

  const pageComponents = Object.values(pages).map(p => <Route path={p.route} key={p.route} element={<StandardPage page={p} />} />);

  return (
    <QueryClientProvider client={queryClient!}>
      <Layout>
        <Routes>
          {pageComponents}
        </Routes>
      </Layout>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
