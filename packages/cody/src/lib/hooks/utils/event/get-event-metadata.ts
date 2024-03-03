import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {JSONSchema} from "json-schema-to-ts";
import {ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {Rule} from "../rule-engine/configuration";
import {getSingleSource, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {detectService} from "../detect-service";
import {names} from "@event-engine/messaging/helpers";
import {FQCNFromDefinitionId, normalizeRefs} from "../value-object/definitions";
import {addSchemaTitles} from "../json-schema/add-schema-titles";
import {jsonSchemaFromShorthand} from "../json-schema/json-schema-from-shorthand";
import {isShorthand} from "../json-schema/shorthand";
import {findAggregateState} from "@cody-engine/cody/hooks/utils/aggregate/find-aggregate-state";

interface EventMetaRaw {
  schema: any;
  service?: string;
  public?: boolean;
  applyRules?: Rule[];
}

export interface EventMeta {
  public: boolean;
  fqcn: string;
  schema: JSONSchema;
  service?: string;
  applyRules?: Rule[];
}

export const getEventMetadata = (event: Node, ctx: Context): EventMeta | CodyResponse => {
  const meta = parseJsonMetadata(event) as EventMetaRaw;
  const service = detectService(event, ctx);

  if(isCodyError(service)) {
    return service;
  }

  if(isCodyError(meta)) {
    return meta;
  }

  const serviceNames = names(service);
  const eventNames = names(event.getName());

  let schema: any = meta.schema || {};
  if(isShorthand(schema)) {
    schema = jsonSchemaFromShorthand(schema as ShorthandObject, '/events');

    if(isCodyError(schema)) {
      return schema;
    }
  }

  if(meta.public) {
    schema['$id'] = `/definitions/${serviceNames.fileName}/${eventNames.fileName}`;
  } else {
    const aggregateState = findAggregateState(event, ctx);

    if(isCodyError(aggregateState)) {
      return aggregateState;
    }

    const aggregateNames = names(aggregateState.getName());

    schema['$id'] = `/definitions/${serviceNames.fileName}/${aggregateNames.fileName}/${eventNames.fileName}`;
  }

  schema = normalizeRefs(addSchemaTitles(event.getName(), schema), service);

  const parsedMeta: EventMeta = {
    "public": !!meta.public,
    fqcn: FQCNFromDefinitionId(schema['$id']),
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
