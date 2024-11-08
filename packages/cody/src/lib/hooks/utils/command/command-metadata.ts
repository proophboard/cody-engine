import {CodyResponse, Node} from "@proophboard/cody-types";
import {CommandMeta} from "@cody-engine/cody/hooks/on-command";
import {JSONSchema7} from "json-schema";
import {ShorthandObject} from "@cody-play/infrastructure/cody/schema/play-json-schema-from-shorthand";
import {UiSchema} from "@rjsf/utils";
import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {Rule} from "@app/shared/rule-engine/configuration";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {Context} from "@cody-engine/cody/hooks/context";
import {detectService} from "@cody-engine/cody/hooks/utils/detect-service";
import {isShorthand} from "@cody-engine/cody/hooks/utils/json-schema/shorthand";
import {withErrorCheck} from "@cody-engine/cody/hooks/utils/error-handling";
import {jsonSchemaFromShorthand} from "@cody-engine/cody/hooks/utils/json-schema/json-schema-from-shorthand";
import {normalizeRefs} from "@cody-engine/cody/hooks/utils/value-object/definitions";
import {addSchemaTitles} from "@cody-engine/cody/hooks/utils/json-schema/add-schema-titles";
import {names} from "@event-engine/messaging/helpers";

interface RawCommandMeta {
  schema: JSONSchema7 | ShorthandObject;
  newAggregate?: boolean;
  aggregateCommand?: boolean;
  service?: string;
  uiSchema?: UiSchema;
  dependencies?: DependencyRegistry;
  rules?: Rule[];
  deleteState?: boolean;
  deleteHistory?: boolean;
  uiDisableFetchState?: boolean;
  streamId?: string;
  streamName?: string;
  publicStream?: string;
}

export const getCommandMetadata = (command: Node, ctx: Context): CommandMeta | CodyResponse => {
  let meta = parseJsonMetadata<RawCommandMeta>(command);

  if(isCodyError(meta)) {
    meta = {
      newAggregate: false,
      aggregateCommand: false,
      schema: {"type": "object"},
    };
  }

  const service = detectService(command, ctx);

  if(isCodyError(service)) {
    return service;
  }

  let schema: any = meta.schema || {};
  if(isShorthand(schema)) {
    schema = withErrorCheck(jsonSchemaFromShorthand, [schema as ShorthandObject, '/commands']);
  }

  const serviceNames = names(service);
  const cmdNames = names(command.getName());

  schema['$id'] = `/definitions/${serviceNames.fileName}/commands/${cmdNames.fileName}`;
  schema = normalizeRefs(addSchemaTitles(command.getName(), schema), service);

  const aggregateCommand = meta.aggregateCommand || meta.newAggregate || false;
  const streamCommand = !aggregateCommand && !!meta.streamId;
  const newAggregate = !!meta.newAggregate;

  return {
    ...meta,
    schema,
    newAggregate,
    aggregateCommand,
    streamCommand
  }
}
