import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {JSONSchema} from "json-schema-to-ts";
import {convertShorthandObjectToJsonSchema, ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {Rule} from "../rule-engine/configuration";
import {getSingleSource, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {detectService} from "../detect-service";
import {names} from "@event-engine/messaging/helpers";
import {FQCNFromDefinitionId} from "../value-object/definitions";

interface EventMetaRaw {
  shorthand?: boolean;
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
  if(meta.shorthand) {
    schema = convertShorthandObjectToJsonSchema(schema as ShorthandObject);

    if(isCodyError(schema)) {
      return schema;
    }
  }

  if(!schema.hasOwnProperty('$id')) {
    if(meta.public) {
      schema['$id'] = `/definitions/${serviceNames.fileName}/${eventNames.fileName}`;
    } else {
      const aggregate = getSingleSource(event, NodeType.aggregate);

      if(isCodyError(aggregate)) {
        return aggregate;
      }

      const aggregateNames = names(aggregate.getName());

      schema['$id'] = `/definitions/${serviceNames.fileName}/${aggregateNames.fileName}/${eventNames.fileName}`;
    }
  }

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
