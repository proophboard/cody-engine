import {
  PlayAggregateRegistry,
  PlayCommandRegistry,
  PlayEventRegistry,
  PlayInformationRegistry, PlayPageRegistry,
  PlayQueryRegistry, PlaySchemaDefinitions, PlayViewRegistry
} from "@cody-play/state/types";
import {ThemeOptions} from "@mui/material";
import {Persona} from "@app/shared/extensions/personas";

export interface FePlayConfig {
  defaultService: string,
  commands: PlayCommandRegistry,
  views: PlayViewRegistry,
  pages: PlayPageRegistry,
  aggregates: PlayAggregateRegistry,
  events: PlayEventRegistry,
  queries: PlayQueryRegistry,
  types: PlayInformationRegistry,
  definitions: PlaySchemaDefinitions,
  theme: ThemeOptions,
  personas: Persona[],
}
