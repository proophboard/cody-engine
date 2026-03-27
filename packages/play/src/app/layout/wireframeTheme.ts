import { ThemeOptions } from '@mui/material/styles';

/**
 * Lo-fi Wireframe Theme for MUI
 * Creates a sketch/wireframe appearance with:
 * - Comic Neue font for handwritten feel
 * - Thick 2px black borders
 * - Minimal shadows and gradients
 * - No animations/transitions
 * - Pastel color palette for light and dark modes
 */

// Pastel color palette - soft, sketch-like colors
const pastelColors = {
  light: {
    primary: { main: '#6B9AC4', light: '#9AB8D6', dark: '#4A7A9B' }, // Soft blue
    secondary: { main: '#C4A4B8', light: '#D9C4D0', dark: '#9B7A8C' }, // Dusty rose
    success: { main: '#A8D5BA', light: '#C8E8D4', dark: '#7A9B8A' }, // Sage green
    warning: { main: '#F4D08C', light: '#F9E8C4', dark: '#C4A46A' }, // Soft yellow
    error: { main: '#E8A4A4', light: '#F4CCCC', dark: '#B87A7A' }, // Muted red
    info: { main: '#A4C8D8', light: '#C8E0E8', dark: '#7A9BA8' }, // Light cyan
  },
  dark: {
    primary: { main: '#8AB8D8', light: '#B8D8F0', dark: '#6A9AB8' }, // Brighter soft blue
    secondary: { main: '#D8B8C8', light: '#F0D8E0', dark: '#B89AA8' }, // Brighter dusty rose
    success: { main: '#B8D8C8', light: '#D8F0E0', dark: '#9AB8A8' }, // Brighter sage
    warning: { main: '#F8D8A8', light: '#FCE8C8', dark: '#D8B888' }, // Brighter soft yellow
    error: { main: '#F8B8B8', light: '#F8D8D8', dark: '#D89A9A' }, // Brighter muted red
    info: { main: '#B8D8E8', light: '#D8F0F8', dark: '#9AB8C8' }, // Brighter light cyan
  },
};

export const createWireframePalette = (mode: 'light' | 'dark') => ({
  mode,
  background: mode === 'light' 
    ? { default: '#FAFAFA', paper: '#FFFFFF' }
    : { default: '#1A1A2E', paper: '#252540' },
  text: mode === 'light'
    ? { primary: '#2D2D2D', secondary: '#5A5A5A' }
    : { primary: '#E8E8E8', secondary: '#B8B8B8' },
  ...pastelColors[mode],
});

export const wireframeTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
    h1: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
    },
    subtitle1: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
    },
    subtitle2: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
    },
    body1: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
    },
    body2: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
    },
    button: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
    },
    overline: {
      fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
      fontWeight: 700,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          transitionDuration: '0s !important',
          animationDuration: '0s !important',
        },
        html: {
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
        },
        body: {
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          '&:hover': {
            boxShadow: 'none !important',
          },
        },
        contained: {
          boxShadow: 'none !important',
          '&:hover': {
            boxShadow: 'none !important',
          },
        },
        outlined: {
          borderWidth: 2,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
        },
        elevation: {
          boxShadow: 'none !important',
        },
        outlined: {
          borderWidth: 2,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
          '& .MuiInput-underline:before': {
            borderBottomWidth: 2,
          },
          '& .MuiInput-underline:after': {
            borderBottomWidth: 2,
          },
          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
            borderBottomWidth: 2,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderWidth: 2,
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:before': {
            borderBottomWidth: 2,
          },
          '&:after': {
            borderBottomWidth: 2,
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomWidth: 2,
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
        underline: {
          '&:before': {
            borderBottomWidth: 2,
          },
          '&:after': {
            borderBottomWidth: 2,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
        outlined: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          borderWidth: 0,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderWidth: 1,
          borderStyle: 'solid',
          borderBottomWidth: 2,
        },
        head: {
          fontWeight: 700,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            borderWidth: 2,
            borderStyle: 'solid',
            boxShadow: 'none !important',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
        outlined: {
          borderWidth: 2,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            borderWidth: 2,
            borderStyle: 'solid',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomStyle: 'solid',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderWidth: 0,
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderWidth: 0,
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderWidth: 2,
          borderStyle: 'solid',
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
          fontWeight: 700,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          '&:hover': {
            boxShadow: 'none !important',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            boxShadow: 'none !important',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-track': {
            borderWidth: 2,
          },
          '& .MuiSlider-rail': {
            borderWidth: 2,
          },
          '& .MuiSlider-thumb': {
            borderWidth: 2,
            borderStyle: 'solid',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            borderWidth: 2,
            borderStyle: 'solid',
            opacity: 1,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.MuiCheckbox-indeterminate': {
            color: 'inherit',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          '& .MuiSvgIcon-root': {
            strokeWidth: 2,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        svg: {
          strokeWidth: 4,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
        outlined: {
          borderWidth: 2,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          borderWidth: 0,
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderWidth: 2,
          borderStyle: 'solid',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '& .MuiStepIcon-text': {
            fontWeight: 700,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomStyle: 'solid',
        },
        indicator: {
          height: 4,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
          fontWeight: 700,
          textTransform: 'none',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          '& .MuiTypography-root': {
            fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
          '&.Mui-focused': {
            fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontFamily: '"Comic Neue", cursive, system-ui, -apple-system, sans-serif',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
          backgroundImage: 'none',
        },
      },
    },
    MuiSpeedDialAction: {
      styleOverrides: {
        fab: {
          borderWidth: 2,
          borderStyle: 'solid',
          boxShadow: 'none !important',
        },
      },
    },
  },
};

export default wireframeTheme;
