import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {names} from "@event-engine/messaging/helpers";
import {isShorthand} from "@cody-engine/cody/hooks/utils/json-schema/shorthand";
import {
  DependencyRegistry,
  isQueryableStateDescription,
  isStateDescription,
  ValueObjectDescriptionFlags
} from "@event-engine/descriptions/descriptions";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {
  playJsonSchemaFromShorthand,
  ShorthandObject
} from "@cody-play/infrastructure/cody/schema/play-json-schema-from-shorthand";
import {playNormalizeRefs} from "@cody-play/infrastructure/cody/schema/play-normalize-refs";
import {playResolveRef} from "@cody-play/infrastructure/cody/schema/play-resolve-ref";
import {PlayInformationRegistry} from "@cody-play/state/types";
import {JSONSchema7} from "json-schema";
import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {UiSchema} from "@rjsf/utils";
import {playAddSchemaTitles} from "@cody-play/infrastructure/cody/schema/play-add-schema-titles";
import {isListSchema} from "@cody-play/infrastructure/cody/schema/check";
import {SortOrder, SortOrderItem} from "@event-engine/infrastructure/DocumentStore";
import {GridDensity} from "@mui/x-data-grid";
import {namespaceToClassName, valueObjectNameFromFQCN} from "@cody-engine/cody/hooks/utils/value-object/namespace";

export interface PlayValueObjectMetadataRaw {
  identifier?: string;
  schema: any;
  querySchema?: any;
  resolve?: ResolveConfig;
  ns?: string;
  collection?: string | boolean;
  initialize?: Rule[];
  uiSchema?: UiSchema & TableUiSchema;
  queryDependencies?: DependencyRegistry;
}

export interface ResolveConfig {
  where?: Rule,
  orderBy?: SortOrderItem | SortOrder,
  rules?: Rule[],
}

export interface RefTableColumn {
  data: string;
  value: Rule[] | string;
}

export interface PageLinkTableColumn {
  page: string;
  mapping: Record<string, string>;
}

export interface TableColumnUiSchema {
  field: string;
  headerName?: string;
  flex?: string | number;
  width?: string | number;
  value?: Rule[] | string;
  pageLink?: string | PageLinkTableColumn;
  ref?: { data: string; value: string };
  link?: string | Rule[];
}

export type StringOrTableColumnUiSchema = string | TableColumnUiSchema;

interface TableProps {
  columns?: StringOrTableColumnUiSchema[],
  pageSize?: number,
  pageSizeOptions?: number[],
  density?: GridDensity,
  hideToolbar?: boolean,
  // @TODO: show/hide specific grid toolbar options or hide entire grid toolbar
  // @TODO: support endless scroll, pagination, ... ?
}

export interface TableUiSchema {
  "ui:table"?: TableProps;
  table?: TableProps;
}

export interface PlayValueObjectMetadata extends ValueObjectDescriptionFlags {
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
  resolve?: ResolveConfig;
  uiSchema?: UiSchema & TableUiSchema;
  queryDependencies?: DependencyRegistry;
}

export const playVoMetadata = (vo: Node, ctx: ElementEditedContext, types: PlayInformationRegistry): PlayValueObjectMetadata | CodyResponse => {
  const meta = playParseJsonMetadata<PlayValueObjectMetadataRaw>(vo);
  const voNames = names(vo.getName());

  if(playIsCodyError(meta)) {
    return meta;
  }

  let ns = meta.ns || '/';

  if(ns[ns.length - 1] !== '/') {
    ns += '/';
  }

  if(isShorthand(meta.schema)) {
    const jsonSchema = playJsonSchemaFromShorthand(meta.schema as ShorthandObject, ns);

    if(playIsCodyError(jsonSchema)) {
      return jsonSchema;
    }

    meta.schema = jsonSchema;
  }

  meta.schema['$id'] = playDefinitionId(vo, ns, ctx);

  const service = playService(vo, ctx);

  if(playIsCodyError(service)) {
    return service;
  }

  if(meta.querySchema) {
    if(isShorthand(meta.querySchema)) {
      const queryJsonSchema = playJsonSchemaFromShorthand(meta.querySchema as ShorthandObject, ns);

      if(playIsCodyError(queryJsonSchema)) {
        return queryJsonSchema;
      }

      meta.querySchema = queryJsonSchema;
    }

    meta.querySchema = playNormalizeRefs(playAddSchemaTitles('Get ' + vo.getName(), meta.querySchema), service);
  }

  const normalizedSchema = playNormalizeRefs(playAddSchemaTitles(vo.getName(), meta.schema), service) as JSONSchema7;

  const hasIdentifier = !!meta.identifier;
  const isQueryable = !!meta.querySchema;

  let isNotStored = false;

  if(typeof meta.collection === "boolean" && !meta.collection) {
    isNotStored = true;
  }

  const convertedMeta: PlayValueObjectMetadata = {
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
    const refVORuntimeInfo = playResolveRef(normalizedSchema.items, normalizedSchema, vo, types);
    if(playIsCodyError(refVORuntimeInfo)) {
      return refVORuntimeInfo;
    }

    convertedMeta.itemType = refVORuntimeInfo.desc.name;

    if(isQueryable) {
      if(isStateDescription(refVORuntimeInfo.desc)) {
        convertedMeta.hasIdentifier = true;
        convertedMeta.identifier = refVORuntimeInfo.desc.identifier;
      }

      if(isQueryableStateDescription(refVORuntimeInfo.desc)) {
        convertedMeta.collection = refVORuntimeInfo.desc.collection;
      } else {
        convertedMeta.collection = names(valueObjectNameFromFQCN(refVORuntimeInfo.desc.name)).constantName.toLowerCase() + '_collection';
      }
    }
  }

  if(isQueryable) {
    convertedMeta.querySchema = meta.querySchema as JSONSchema7;
    if(!convertedMeta.collection && convertedMeta.hasIdentifier && (typeof meta.collection === "undefined" || typeof meta.collection === "string")) {
      convertedMeta.collection = meta.collection || voNames.constantName.toLowerCase() + '_collection';
    }
  }

  convertedMeta.isNotStored = isNotStored;

  if(meta.queryDependencies) {
    convertedMeta.queryDependencies = meta.queryDependencies;
  }

  return convertedMeta;
}
