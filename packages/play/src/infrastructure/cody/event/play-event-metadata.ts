import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {PlayInformationRegistry} from "@cody-play/state/types";
import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {JSONSchema7} from "json-schema";
import {names} from "@event-engine/messaging/helpers";
import {isShorthand} from "@cody-engine/cody/hooks/utils/json-schema/shorthand";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {
  playJsonSchemaFromShorthand,
  ShorthandObject
} from "@cody-play/infrastructure/cody/schema/play-json-schema-from-shorthand";
import {playFindAggregateState, playGetSingleSource} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playNormalizeRefs} from "@cody-play/infrastructure/cody/schema/play-normalize-refs";
import {playAddSchemaTitles} from "@cody-play/infrastructure/cody/schema/play-add-schema-titles";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";

interface EventMetaRaw {
  schema: any;
  service?: string;
  public?: boolean;
  applyRules?: Rule[];
}

export interface PlayEventMeta {
  public: boolean;
  fqcn: string;
  schema: JSONSchema7;
  service?: string;
  applyRules?: Rule[];
}

export const playEventMetadata = (event: Node, ctx: ElementEditedContext, types: PlayInformationRegistry): PlayEventMeta | CodyResponse => {
  const meta = playParseJsonMetadata(event) as EventMetaRaw;
  const service = playService(event, ctx);

  if(playIsCodyError(service)) {
    return service;
  }

  if(playIsCodyError(meta)) {
    return meta;
  }

  const serviceNames = names(service);
  const eventNames = names(event.getName());

  let schema: any = meta.schema || {};
  if(isShorthand(schema)) {
    schema = playJsonSchemaFromShorthand(schema as ShorthandObject, '/events');

    if(playIsCodyError(schema)) {
      return schema;
    }
  }

  if(meta.public) {
    schema['$id'] = `/definitions/${serviceNames.fileName}/${eventNames.fileName}`;
  } else {
    const aggregate = playFindAggregateState(event, ctx, types);

    if(playIsCodyError(aggregate)) {
      return aggregate;
    }

    const aggregateNames = names(aggregate.getName());

    schema['$id'] = `/definitions/${serviceNames.fileName}/${aggregateNames.fileName}/${eventNames.fileName}`;
  }

  schema = playNormalizeRefs(playAddSchemaTitles(event.getName(), schema), service);

  const parsedMeta: PlayEventMeta = {
    "public": !!meta.public,
    fqcn: playFQCNFromDefinitionId(schema['$id']),
    schema,
  }

  if(meta.service) {
    parsedMeta.service = meta.service;
  }

  if(meta.applyRules) {
    parsedMeta.applyRules = meta.applyRules;
  }

  return parsedMeta;
}
