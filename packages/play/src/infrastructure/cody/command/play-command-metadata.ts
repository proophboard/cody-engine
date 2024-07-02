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
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playAddSchemaTitles} from "@cody-play/infrastructure/cody/schema/play-add-schema-titles";
import {playNormalizeRefs} from "@cody-play/infrastructure/cody/schema/play-normalize-refs";
import {names} from "@event-engine/messaging/helpers";

interface RawCommandMeta {
  schema: JSONSchema7 | ShorthandObject;
  newAggregate?: boolean;
  aggregateCommand?: boolean;
  service?: string;
  uiSchema?: UiSchema;
  dependencies?: DependencyRegistry;
  deleteState?: boolean;
  deleteHistory?: boolean;
  uiDisableFetchState?: boolean;
  streamIdExpr?: string;
  streamName?: string;
  publicStream?: string;
}

export interface PlayCommandMeta {
  newAggregate: boolean;
  schema: JSONSchema7;
  aggregateCommand: boolean;
  service?: string;
  uiSchema?: UiSchema;
  dependencies?: DependencyRegistry;
  deleteState?: boolean;
  deleteHistory?: boolean;
  uiDisableFetchState?: boolean;
  streamIdExpr?: string;
  streamName?: string;
  publicStream?: string;
}

export const playCommandMetadata = (command: Node, ctx: ElementEditedContext): PlayCommandMeta | CodyResponse => {
  let meta = playParseJsonMetadata<RawCommandMeta>(command);

  if(playIsCodyError(meta)) {
    meta = {
      newAggregate: false,
      aggregateCommand: false,
      schema: {"type": "object"},
    };
  }

  const service = playService(command, ctx);

  if(playIsCodyError(service)) {
    return service;
  }

  let schema = meta.schema || {};
  if(isShorthand(schema)) {
    const convertedSchema = playJsonSchemaFromShorthand(schema, '/commands');

    if(playIsCodyError(convertedSchema)) {
      return convertedSchema;
    }

    schema = playNormalizeRefs(playAddSchemaTitles(command.getName(), convertedSchema), service);
  }

  schema['$id'] = `/definitions/${names(service).fileName}/commands/${names(command.getName()).fileName}`;

  const aggregateCommand = meta.aggregateCommand || meta.newAggregate || false;
  const newAggregate = !!meta.newAggregate;

  return {
    ...meta,
    schema,
    newAggregate,
    aggregateCommand
  }
}
