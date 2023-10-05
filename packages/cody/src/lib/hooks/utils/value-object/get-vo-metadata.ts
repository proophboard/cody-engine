import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {JSONSchema7} from "json-schema-to-ts";
import {ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {detectService} from "../detect-service";
import {definitionId, normalizeRefs} from "./definitions";
import {names} from "@event-engine/messaging/helpers";
import {isQueryableStateDescription, isStateDescription} from "@event-engine/descriptions/descriptions";
import {isListSchema} from "../json-schema/list-schema";
import {resolveRef} from "../json-schema/resolve-ref";
import {addSchemaTitles} from "../json-schema/add-schema-titles";
import {jsonSchemaFromShorthand} from "../json-schema/json-schema-from-shorthand";
import {isShorthand} from "../json-schema/shorthand";
import {ValueObjectMetadata, ValueObjectMetadataRaw} from "@cody-engine/cody/hooks/utils/value-object/types";

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

  if(isShorthand(meta.schema)) {
    const jsonSchema = jsonSchemaFromShorthand(meta.schema as ShorthandObject, ns);

    if(isCodyError(jsonSchema)) {
      return jsonSchema;
    }

    meta.schema = jsonSchema;
  }

  meta.schema['$id'] = definitionId(vo, ns, ctx);

  const service = detectService(vo, ctx);

  if(isCodyError(service)) {
    return service;
  }

  if(meta.querySchema) {
    if(isShorthand(meta.querySchema)) {
      const queryJsonSchema = jsonSchemaFromShorthand(meta.querySchema as ShorthandObject, ns);

      if(isCodyError(queryJsonSchema)) {
        return queryJsonSchema;
      }

      meta.querySchema = queryJsonSchema;
    }

    meta.querySchema = normalizeRefs(addSchemaTitles('Get ' + vo.getName(), meta.querySchema), service);
  }

  const normalizedSchema = normalizeRefs(addSchemaTitles(vo.getName(), meta.schema), service) as JSONSchema7;

  const hasIdentifier = !!meta.identifier;
  const isQueryable = !!meta.querySchema;

  const convertedMeta: ValueObjectMetadata = {
    schema: normalizedSchema,
    ns,
    service,
    isList: isListSchema(normalizedSchema),
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

  if(meta.uiSchema) {
    convertedMeta.uiSchema = meta.uiSchema;
  }

  if(meta.resolve) {
    convertedMeta.resolve = meta.resolve;
  }

  if(isListSchema(normalizedSchema)) {
    const refVORuntimeInfo = resolveRef(normalizedSchema.items, normalizedSchema, vo);
    if(isCodyError(refVORuntimeInfo)) {
      return refVORuntimeInfo;
    }

    convertedMeta.itemType = refVORuntimeInfo.desc.name;

    if(isQueryable) {
      if(!isStateDescription(refVORuntimeInfo.desc)) {
        return {
          cody: `The queryable list value object "${vo.getName()}" references value object: "${refVORuntimeInfo.desc.name}", which is not a state value object. This combination is not supported.`,
          type: CodyResponseType.Error,
          details: `Define an identifier for "${refVORuntimeInfo.desc.name}" in its metadata and tell me about it.`
        }
      }
      convertedMeta.hasIdentifier = true;
      convertedMeta.identifier = refVORuntimeInfo.desc.identifier;

      if(isQueryableStateDescription(refVORuntimeInfo.desc)) {
        convertedMeta.collection = refVORuntimeInfo.desc.collection;
      }
    }
  }

  return convertedMeta;
}
