import {createTheme} from "@mui/material";

declare module '@mui/material/styles' {
  interface Theme {
    topBar: {
      background: string;
    };
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    topBar: {
      background: string;
    };
  }
}

export const theme = createTheme({topBar: {background: '#42423B'}});
