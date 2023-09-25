import {UiSchema} from "@rjsf/utils";
import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {JSONSchema7} from "json-schema";
import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {
  playJsonSchemaFromShorthand,
  ShorthandObject
} from "@cody-play/infrastructure/cody/schema/play-json-schema-from-shorthand";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {isShorthand} from "@cody-engine/cody/hooks/utils/json-schema/shorthand";

interface RawCommandMeta {
  newAggregate: boolean;
  schema: JSONSchema7 | ShorthandObject;
  service?: string;
  uiSchema?: UiSchema;
  dependencies?: DependencyRegistry;
  deleteState?: boolean;
  deleteHistory?: boolean;
  uiDisableFetchState?: boolean;
}

export interface PlayCommandMeta {
  newAggregate: boolean;
  schema: JSONSchema7;
  service?: string;
  uiSchema?: UiSchema;
  dependencies?: DependencyRegistry;
  deleteState?: boolean;
  deleteHistory?: boolean;
  uiDisableFetchState?: boolean;
}

export const playCommandMetadata = (command: Node, ctx: ElementEditedContext): PlayCommandMeta | CodyResponse => {
  const meta = playParseJsonMetadata<RawCommandMeta>(command);

  if(playIsCodyError(meta)) {
    return meta;
  }

  let schema = meta.schema || {};
  if(isShorthand(schema)) {
    const convertedSchema = playJsonSchemaFromShorthand(schema, '/commands');

    if(playIsCodyError(convertedSchema)) {
      return convertedSchema;
    }

    schema = convertedSchema;
  }

  return {
    ...meta,
    schema
  }
}
