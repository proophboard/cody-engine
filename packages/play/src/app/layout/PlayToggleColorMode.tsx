import * as React from 'react';
import {ReactNode, useContext} from "react";
import {createTheme} from "@frontend/app/layout/theme";
import {ThemeProvider} from "@mui/material/styles";
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {configStore} from "@cody-play/state/config-store";
import {useVibeCodyOpen} from "@cody-play/hooks/use-vibe-cody";
import {merge} from "lodash/fp";
import {
  VIBE_CODY_DRAWER_WIDTH,
  VIBE_CODY_DRAWER_WIDTH_SMALL
} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {useMediaQuery} from "@mui/material";

interface Props {
  children: ReactNode
}

const defaultTheme = createTheme({});

const PlayToggleColorMode = ({children}: Props) => {
  const {config} = useContext(configStore);
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  const [vibeCodyOpen] = useVibeCodyOpen();

  const largeDrawer = useMediaQuery(defaultTheme.breakpoints.up('xl'), {
    defaultMatches: true,
  });

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
            width: `calc(100% - ${largeDrawer ? VIBE_CODY_DRAWER_WIDTH : VIBE_CODY_DRAWER_WIDTH_SMALL}px)`,
            '& .MuiBackdrop-root': {
              right: `${largeDrawer ? VIBE_CODY_DRAWER_WIDTH : VIBE_CODY_DRAWER_WIDTH_SMALL}px`
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
    [mode, config.theme, vibeCodyOpen, largeDrawer],
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
