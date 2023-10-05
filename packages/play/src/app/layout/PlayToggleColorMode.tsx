import * as React from 'react';
import {ReactNode, useContext} from "react";
import {createTheme} from "@frontend/app/layout/theme";
import {ThemeProvider} from "@mui/material/styles";
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {configStore} from "@cody-play/state/config-store";

interface Props {
  children: ReactNode
}

const PlayToggleColorMode = ({children}: Props) => {
  const {config} = useContext(configStore);
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
        ...config.theme,
        palette: {
          ...config.theme.palette || {},
          mode,
        },
      }),
    [mode, config.theme],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default PlayToggleColorMode;
