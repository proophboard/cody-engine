import React, { useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface Props {
  children: ReactNode;
}

export const ColorModeContext = React.createContext({ mode: 'light', toggleColorMode: () => {} });

const ToggleColorMode = ({ children }: Props) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [themeConfig, setThemeConfig] = useState<any>();

  useEffect(() => {
    fetch('/api/theme-config')
      .then((response) => response.json())
      .then((data) => setThemeConfig(data))
      .catch((error) => console.error('Failed to fetch themeConfig:', error));
  }, []);

  const colorMode = {
    mode,
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  };

  const theme = useMemo(() => {
    if (!themeConfig) return createTheme({
      palette: {
        mode,
      }
    });

    return createTheme({
      palette: {
        mode,
        primary: {
          main: themeConfig.primaryColor,
        },
        secondary: {
          main: themeConfig.secondaryColor,
        },
        background: {
          default: themeConfig.backgroundColor,
        },
        text: {
          primary: themeConfig.textColor,
          secondary: mode === 'light' ? '#424242' : '#ffffff',
        },
      },
      typography: {
        fontFamily: themeConfig.fontFamily,
        button: {
          textTransform: 'none',
        },
      },
      shape: {
        borderRadius: parseInt(themeConfig.borderRadius, 10),
      },
    });
  }, [mode, themeConfig]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ToggleColorMode;
