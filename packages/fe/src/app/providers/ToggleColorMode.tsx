import React, { ReactNode, useState, useMemo, useCallback } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from "@frontend/app/layout/theme";

interface Props {
  children: ReactNode;
}

// Erstellen des ThemeContexts
export const ThemeContext = React.createContext({
  mode: 'light',
  toggleColorMode: () => {},
  themeConfig: null,
  applyTheme: (config: any) => {},
});

// Hauptkomponente
const ToggleColorMode = ({ children }: Props) => {
  // Zustandsvariablen
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [themeConfig, setThemeConfig] = useState<any>(null);

  // Kontextwert
  const toggleColorMode = useCallback(() => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const applyTheme = useCallback((config: any) => {
    setThemeConfig(config);
  }, []);

  const themeContextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
      themeConfig,
      applyTheme,
    }),
    [mode, toggleColorMode, themeConfig, applyTheme]
  );

  // Erstellen des Themes
  const theme = useMemo(
    () =>
      createTheme({
        ...themeConfig,
        palette: {
          ...themeConfig?.palette,
          mode,
        },
      }),
    [mode, themeConfig]
  );

  // Rendern der Komponente
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ToggleColorMode;
