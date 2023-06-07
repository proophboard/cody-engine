import {createTheme, SxProps} from "@mui/material";

declare module '@mui/material/styles' {
  interface Theme {
    stateView: {
      "styleOverrides": SxProps;
    }
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    stateView: {
      "styleOverrides": SxProps;
    }
  }
}

export const theme = createTheme({
  stateView: {
    styleOverrides: {
      "form.stateview .Mui-disabled": {
        color: "inherit",
        "-webkit-text-fill-color": "inherit",

      },
      "form.stateview .MuiButton-root.Mui-disabled": {
        display: "none",
      },
      "form.stateview .MuiSelect-icon.Mui-disabled": {
        display: "none",
      },
      "form.stateview .MuiInput-underline.Mui-disabled:before": {
        borderBottom: "1px solid #eee",
      }
    }
  },
  components: {
    MuiFormControl: {
      defaultProps: {
        variant: "standard"
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: "standard"
      }
    },
    MuiSelect: {
      defaultProps: {
        variant: "standard"
      }
    }
  }
});
