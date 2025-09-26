import {createTheme as createMuiTheme, PaletteOptions, SxProps, Theme, ThemeOptions} from "@mui/material";
import {merge} from "lodash/fp";
import overwriteTheme from "@frontend/extensions/app/layout/theme";
import {COLOR_MODE} from "@frontend/app/providers/ToggleColorMode";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import jexl from "@app/shared/jexl/get-configured-jexl";

declare module '@mui/material/styles' {
  interface Theme {
    commandForm: {
      "styleOverrides": SxProps;
    }
    stateView: {
      "styleOverrides": SxProps;
    },
    formAction: {
      "styleOverrides": SxProps;
    }
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    darkPalette?: PaletteOptions,
    lightPalette?: PaletteOptions,
    vars?: Record<string, any>,
    commandForm?: {
      "styleOverrides": SxProps;
    }
    stateView?: {
      "styleOverrides": SxProps;
    },
    formAction?: {
      "styleOverrides": SxProps;
    }
  }
}

const normalizeThemeOptions = (themeOptions: ThemeOptions & {[key: string]: any} | string, ctx: {vars: Record<string, any>, theme: Theme}): ThemeOptions | string => {
  if(typeof themeOptions === "object") {
    for (const option in themeOptions) {
      themeOptions[option] = normalizeThemeOptions(themeOptions[option], ctx);
    }
  } else if (typeof themeOptions === "string") {
    const parts = themeOptions.split('$>');

    if(parts.length >= 2) {
      parts.shift();
      return jexl.evalSync(parts.join("$>"), ctx);
    }
  }
  return themeOptions;
}

const defaultMuiTheme = createMuiTheme({});

const normalizePalette = (options: ThemeOptions): ThemeOptions => {
  options = cloneDeepJSON(options);

  const vars = options.vars || {};
  const mode: COLOR_MODE = options.palette?.mode || 'light';
  const modePalette = normalizeThemeOptions({palette: {...options[`${mode}Palette`], mode}}, {vars, theme: defaultMuiTheme}) as ThemeOptions;

  delete options.darkPalette;
  delete options.lightPalette;
  delete options.vars;

  const muiThemeWithModePalette = createMuiTheme(modePalette);

  options.palette = merge(modePalette.palette, {...options.palette, mode}) as PaletteOptions;

  return normalizeThemeOptions(options, {vars, theme: muiThemeWithModePalette}) as ThemeOptions;
}

export const createTheme = (options: ThemeOptions): ReturnType<typeof createMuiTheme> => {
  options = normalizePalette(options);

  const defaultTheme = createMuiTheme(options);

  options = merge(
    {
      formAction: {
        styleOverrides: {
        }
      },
      stateView: {
        styleOverrides: {
          "form.stateview .Mui-disabled:not(.CodyTopRightActions .Mui-disabled)": {
            color: "inherit",
            WebkitTextFillColor: "inherit",

          },
          "form.stateview .MuiButton-root.Mui-disabled:not(.CodyTopRightActions .Mui-disabled)": {
            display: "none",
          },
          "form.stateview .MuiSelect-icon.Mui-disabled": {
            display: "none",
          },
          "form.stateview .MuiInput-underline.Mui-disabled:before": {
            borderBottom: "1px solid #eee",
          },
          "form.stateview .MuiFormLabel-asterisk": {
            display: "none",
          }
        }
      },
      typography: {
        h1: {
          fontSize: '1.7rem',
          fontWeight: 400,
        },
        h2: {
          fontSize: '1.25rem',
          fontWeight: 500,
        },
        h3: {
          fontSize: '1.15rem',
          fontWeight: 500,
        },
        h4: {
          fontSize: '1.1rem',
          fontWeight: 500,
        },
        h5: {
          fontSize: '1.05rem',
          fontWeight: 500,
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 500,
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

  options = normalizePalette(merge(options, overwriteTheme(codyEngineTheme)));

  return createMuiTheme(options);
}
