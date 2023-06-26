import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {JSONSchema7} from "json-schema-to-ts";
import {convertShorthandObjectToJsonSchema, ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {detectService} from "../detect-service";
import {definitionId, normalizeRefs} from "./definitions";
import {names} from "@event-engine/messaging/helpers";
import {
  isQueryableStateDescription,
  isStateDescription,
  ValueObjectDescriptionFlags
} from "@event-engine/descriptions/descriptions";
import {Rule} from "../rule-engine/configuration";
import {isListSchema} from "../json-schema/list-schema";
import {resolveRef} from "../json-schema/resolve-ref";
import {UiSchema} from "@rjsf/utils";
import {GridDensity} from "@mui/x-data-grid";

interface ValueObjectMetadataRaw {
  identifier?: string;
  shorthand?: boolean;
  schema: any;
  querySchema?: any;
  ns?: string;
  collection?: string;
  initialize?: Rule[];
  uiSchema?: UiSchema & TableUiSchema;
}

export interface TableColumnUiSchema {
  field: string;
  headerName?: string;
  flex?: string | number;
  width?: string | number;
  value?: Rule[] | string;
  pageLink?: string;
  link?: string | Rule[];
}

export interface TableUiSchema {
  table?: {
    columns?: TableColumnUiSchema[],
    pageSize?: number,
    pageSizeOptions?: number[],
    density?: GridDensity,
    // @TODO: show/hide specific grid toolbar options or hide entire grid toolbar
    // @TODO: support endless scroll, pagination, ... ?
  }
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
  itemType?: string;
  uiSchema?: UiSchema & TableUiSchema;
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
