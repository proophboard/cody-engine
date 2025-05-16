import * as React from 'react';
import {ReactNode, useContext} from "react";
import {createTheme} from "@frontend/app/layout/theme";
import {ThemeProvider} from "@mui/material/styles";
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {configStore} from "@cody-play/state/config-store";
import {useVibeCodyDrawerOpen} from "@cody-play/hooks/use-vibe-cody-drawer-open";
import {merge} from "lodash/fp";
import {VIBE_CODY_DRAWER_WIDTH} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";

interface Props {
  children: ReactNode
}

const PlayToggleColorMode = ({children}: Props) => {
  const {config} = useContext(configStore);
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  const [vibeCodyOpen] = useVibeCodyDrawerOpen();
  const colorMode = {
    mode,
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  };

  const components = vibeCodyOpen
    ?  {
      MuiDialog: {
        styleOverrides: {
          root: {
            width: `calc(100% - ${VIBE_CODY_DRAWER_WIDTH}px)`,
            '& .MuiBackdrop-root': {
              right: `${VIBE_CODY_DRAWER_WIDTH}px`
            }
          }
        }
      }
    }
    : {};

  const theme = React.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      createTheme({
        ...merge(config.theme, {components}),
        palette: {
          ...config.theme.palette || {},
          mode,
        }
      }),
    [mode, config.theme, vibeCodyOpen],
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
