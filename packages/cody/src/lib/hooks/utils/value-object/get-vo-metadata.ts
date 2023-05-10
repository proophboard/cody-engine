import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {JSONSchema7} from "json-schema-to-ts";
import {convertShorthandObjectToJsonSchema, ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {detectService} from "../detect-service";

interface ValueObjectMetadataRaw {
  aggregateState?: boolean;
  identifier?: string;
  shorthand: boolean;
  schema: object;
  ns?: string;
}

interface ValueObjectMetadata {
  aggregateState: boolean;
  schema: JSONSchema7;
  ns: string;
  service: string;
  identifier?: string;
}

export const getVoMetadata = (vo: Node, ctx: Context): ValueObjectMetadata | CodyResponse => {
  const meta = parseJsonMetadata<ValueObjectMetadataRaw>(vo);

  if(isCodyError(meta)) {
    return meta;
  }

  let ns = meta.ns || '/';

  if(ns[ns.length - 1] !== '/') {
    ns += '/';
  }

  if(meta.shorthand) {
    const jsonSchema = convertShorthandObjectToJsonSchema(meta.schema as ShorthandObject, ns);

    if(isCodyError(jsonSchema)) {
      return jsonSchema;
    }

    meta.schema = jsonSchema;
  }

  const service = detectService(vo, ctx);

  if(isCodyError(service)) {
    return service;
  }

  return {
    aggregateState: !!meta.aggregateState,
    schema: meta.schema as JSONSchema7,
    ns,
    service,
    identifier: meta.identifier,
  };
}
