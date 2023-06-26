import {createTheme as createMuiTheme, SxProps, ThemeOptions} from "@mui/material";
import {merge} from "lodash";

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

export const createTheme = (options: ThemeOptions): ReturnType<typeof createMuiTheme> => {
  options = merge(
    {
      stateView: {
        styleOverrides: {
          "form.stateview .Mui-disabled": {
            color: "inherit",
            WebkitTextFillColor: "inherit",

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
    },
    options
  );

  return createMuiTheme(options);
}
