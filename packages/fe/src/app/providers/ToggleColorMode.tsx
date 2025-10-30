import React, {ReactNode} from "react";
import { ThemeProvider } from '@mui/material/styles';
import {createTheme} from "@frontend/app/layout/theme";

interface Props {
  children: ReactNode
}

export type COLOR_MODE = 'dark' | 'light';

export const ColorModeContext = React.createContext<{mode: COLOR_MODE, toggleColorMode: () => void}>({mode: 'light', toggleColorMode: () => {} });

const ToggleColorMode = ({children}: Props) => {
  let initial: COLOR_MODE = 'light';

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    initial = 'dark';
  }

  const [mode, setMode] = React.useState<COLOR_MODE>(initial);
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
