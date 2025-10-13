import {
  PlayAggregateRegistry, PlayApplyRulesRegistry,
  PlayCommandHandlerRegistry,
  PlayCommandRegistry, PlayEventPolicyRegistry,
  PlayEventRegistry, PlayInformationRegistry, PlayQueryRegistry, PlayResolverRegistry,
  PlaySchemaDefinitions, PlayServiceRegistry
} from "@cody-play/package/state/types";
import {PaletteOptions, SxProps} from "@mui/material";
import {Persona} from "@app/shared/extensions/personas";

export interface BePlayConfig {
  defaultService: string,
  commands: PlayCommandRegistry,
  commandHandlers: PlayCommandHandlerRegistry,
  aggregates: PlayAggregateRegistry,
  events: PlayEventRegistry,
  eventReducers: PlayApplyRulesRegistry,
  eventPolicies: PlayEventPolicyRegistry,
  queries: PlayQueryRegistry,
  resolvers: PlayResolverRegistry,
  types: PlayInformationRegistry,
  definitions: PlaySchemaDefinitions,
  services: PlayServiceRegistry,
  personas: Persona[],
}

// Override MUI theme options to avoid compile errors of Cody Play Config
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
