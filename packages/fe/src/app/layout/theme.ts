import {createTheme as createMuiTheme, SxProps, ThemeOptions} from "@mui/material";
import {merge} from "lodash";
import overwriteTheme from "@frontend/extensions/app/layout/theme";

declare module '@mui/material/styles' {
  interface Theme {
    stateView: {
      "styleOverrides": SxProps;
    }
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    stateView?: {
      "styleOverrides": SxProps;
    }
  }
}

export const createTheme = (options: ThemeOptions): ReturnType<typeof createMuiTheme> => {
  const defaultTheme = createMuiTheme(options);

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
      typography: {
        h3: {
          fontSize: '2rem'
        },
        h4: {
          fontSize: '1.5rem'
        },
        h5: {
          fontSize: '1.3rem'
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
        },
        // Fix: No Rows Overlay not visible in empty table
        MuiGrid2: {
          styleOverrides: {
            root: {
              "& .MuiDataGrid-overlayWrapper": {
                minHeight: "250px"
              },
              "& .MuiDataGrid-cell a": {
                color: defaultTheme.palette.primary.main,
                fontWeight: 500,
                textDecoration: 'none'
              }
            }
          }
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              boxShadow: "none"
            }
          }
        },
        MuiAvatar: {
          styleOverrides: {
            root: {
              "& .MuiAvatar-img": {
                objectFit: 'contain'
              }
            }
          }
        }
      }
    },
    options
  );

  const codyEngineTheme = createMuiTheme(defaultTheme, options);

  options = merge(options, overwriteTheme(codyEngineTheme));

  return createMuiTheme(options);
}
