import { useState, createContext, useMemo, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface Props {
  children: ReactNode;
}

export const ColorModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => {},
  toggleTheme: () => {}
});

const ToggleColorMode = ({ children }: Props) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [themeConfig, setThemeConfig] = useState({
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    textColor: '#000000',
    fontFamily: 'Arial',
    backgroundColor: '#ffffff',
    borderRadius: '4px'
  });

  const toggleColorMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const getRandomFont = () => {
    const fonts = ['Arial', 'Roboto', 'Georgia', 'Times New Roman', 'Courier New'];
    return fonts[Math.floor(Math.random() * fonts.length)];
  };

  const toggleTheme = () => {
    const newThemeConfig = {
      primaryColor: getRandomColor(),
      secondaryColor: getRandomColor(),
      textColor: getRandomColor(),
      fontFamily: getRandomFont(),
      backgroundColor: getRandomColor(),
      borderRadius: `${Math.floor(Math.random() * 20) + 4}px` 
    };
    setThemeConfig(newThemeConfig);
  };

  const theme = useMemo(() => createTheme({
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
        secondary: '#ffffff'
      }
    },
    typography: {
      fontFamily: themeConfig.fontFamily,
      button: {
        textTransform: 'none'
      }
    },
    shape: {
      borderRadius: parseInt(themeConfig.borderRadius)
    }
  }), [mode, themeConfig]);

  const contextValue = useMemo(() => ({
    mode,
    toggleColorMode,
    toggleTheme
  }), [mode, toggleColorMode, toggleTheme]);

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ToggleColorMode;
