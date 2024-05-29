import React, { ReactNode, useEffect, useState, useMemo } from "react";
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from "@frontend/app/layout/theme";

interface Props {
  children: ReactNode
}

// Erstellen des ThemeContexts
export const ThemeContext = React.createContext({ 
  mode: 'light', 
  toggleColorMode: () => { },
  themeConfig: null, 
  applyTheme: (config: any) => { } 
});

// Hauptkomponente
const ToggleColorMode = ({ children }: Props) => {
  // Zustandsvariablen
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [themeConfig, setThemeConfig] = useState<any>(null);

  // Kontextwert
  const themeContextValue = {
    mode,
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
    themeConfig,
    applyTheme: (config: any) => {
      setThemeConfig(config);
    },
  };

  // Erstellen des Themes
  const theme = useMemo(
    () =>
      createTheme(themeConfig || {
        palette: {
          mode,
        },
      }),
    [mode, themeConfig],
  );

  // Rendern der Komponente
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default ToggleColorMode;