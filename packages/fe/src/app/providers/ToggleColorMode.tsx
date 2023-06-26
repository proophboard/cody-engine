import React, {ReactNode} from "react";
import { ThemeProvider } from '@mui/material/styles';
import {createTheme} from "@frontend/app/layout/theme";

interface Props {
  children: ReactNode
}

export const ColorModeContext = React.createContext({mode: 'light', toggleColorMode: () => {} });

const ToggleColorMode = ({children}: Props) => {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  const colorMode = {
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    };

  const theme = React.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default ToggleColorMode;
