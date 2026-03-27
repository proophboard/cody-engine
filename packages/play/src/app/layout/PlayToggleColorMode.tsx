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
import {wireframeTheme, createWireframePalette} from "./wireframeTheme";

interface Props {
  children: ReactNode
}

const defaultTheme = createTheme({});

export type ThemeMode = 'default' | 'wireframe';

export interface ThemeModeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
}

export const ThemeModeContext = React.createContext<ThemeModeContextType | undefined>(undefined);

const PlayToggleColorMode = ({children}: Props) => {
  const {config} = useContext(configStore);
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');
  const [themeMode, setThemeMode] = React.useState<ThemeMode>('default');
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

  const themeModeContextValue = {
    mode,
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
    themeMode,
    toggleThemeMode: () => {
      setThemeMode((prevMode) => (prevMode === 'default' ? 'wireframe' : 'default'));
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
    () => {
      if (themeMode === 'wireframe') {
        const wireframePalette = createWireframePalette(mode);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return createTheme({
          ...wireframeTheme,
          palette: wireframePalette,
          ...merge(config.theme, {components}),
        });
      }
      
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return createTheme({
        ...merge(config.theme, {components}),
        palette: {
          ...config.theme.palette || {},
          mode,
        }
      });
    },
    [mode, config.theme, vibeCodyOpen, largeDrawer, themeMode],
  );

  return (
    <ThemeModeContext.Provider value={themeModeContextValue}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </ThemeModeContext.Provider>
  );
};

export default PlayToggleColorMode;
