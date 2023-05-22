import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {JSONSchema7} from "json-schema-to-ts";
import {convertShorthandObjectToJsonSchema, ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {detectService} from "../detect-service";
import {definitionId, normalizeRefs} from "./definitions";
import {names} from "@event-engine/messaging/helpers";
import { ValueObjectDescriptionFlags } from "@event-engine/descriptions/descriptions";
import {Rule} from "../rule-engine/configuration";

interface ValueObjectMetadataRaw {
  identifier?: string;
  shorthand?: boolean;
  schema: object;
  querySchema?: object;
  ns?: string;
  collection?: string;
  initialize?: Rule[];
}

export interface ValueObjectMetadata extends ValueObjectDescriptionFlags {
  schema: JSONSchema7;
  querySchema?: JSONSchema7;
  ns: string;
  service: string;
  isList: boolean;
  hasIdentifier: boolean;
  isQueryable: boolean;
  identifier?: string;
  collection?: string;
  initialize?: Rule[];
}

export const getVoMetadata = (vo: Node, ctx: Context): ValueObjectMetadata | CodyResponse => {
  const meta = parseJsonMetadata<ValueObjectMetadataRaw>(vo);
  const voNames = names(vo.getName());

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

    meta.schema['$id'] = definitionId(vo, ns, ctx);

    if(meta.querySchema) {
      const queryJsonSchema = convertShorthandObjectToJsonSchema(meta.querySchema as ShorthandObject, ns);

      if(isCodyError(queryJsonSchema)) {
        return queryJsonSchema;
      }

      meta.querySchema = queryJsonSchema;
    }
  }

  const service = detectService(vo, ctx);

  if(isCodyError(service)) {
    return service;
  }

  const normalizedSchema = normalizeRefs(meta.schema, service) as JSONSchema7;

  const hasIdentifier = !!meta.identifier;
  const isQueryable = !!meta.querySchema;

  const convertedMeta: ValueObjectMetadata = {
    schema: normalizedSchema,
    ns,
    service,
    isList: normalizedSchema['type'] === 'array',
    hasIdentifier,
    isQueryable,
  }

  if(hasIdentifier) {
    convertedMeta.identifier = meta.identifier;
  }

  if(isQueryable) {
    convertedMeta.querySchema = normalizeRefs(meta.querySchema, service) as JSONSchema7;
    convertedMeta.collection = meta.collection || voNames.constantName.toLowerCase() + '_collection';
  }

  if(meta.initialize) {
    convertedMeta.initialize = meta.initialize;
  }

  return convertedMeta;
}
