import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {detectService, getDefaultService} from "../detect-service";
import {
  definitionId,
  definitionIdFromFQCN,
  FQCNFromDefinitionId,
  nodeLabelFromFQCN,
  normalizeRefs, renameFQCN
} from "./definitions";
import {names} from "@event-engine/messaging/helpers";
import {
  isListDescription,
  isQueryableStateDescription,
  isStateDescription
} from "@event-engine/descriptions/descriptions";
import {isListSchema} from "../json-schema/list-schema";
import {resolveRef} from "../json-schema/resolve-ref";
import {addSchemaTitles} from "../json-schema/add-schema-titles";
import {jsonSchemaFromShorthand} from "../json-schema/json-schema-from-shorthand";
import {isShorthand} from "../json-schema/shorthand";
import {ValueObjectMetadata, ValueObjectMetadataRaw} from "@cody-engine/cody/hooks/utils/value-object/types";
import {addPropertySchemaIds} from "@cody-engine/cody/hooks/utils/json-schema/add-property-schema-ids";
import {isRefSchema, RefSchema} from "@app/shared/utils/json-schema/is-ref-schema";
import {JSONSchema7} from "json-schema-to-ts";
import {isInlineItemsArraySchema} from "@app/shared/utils/schema-checks";
import {normalizeProjectionConfig} from "@app/shared/rule-engine/projection-config";
import {normalizeServerUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {toSingularItemName} from "@event-engine/infrastructure/nlp/to-singular";

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

  const isMaybeShorthand = typeof meta.shorthand === "undefined" || meta.shorthand;

  if(isMaybeShorthand && isShorthand(meta.schema)) {
    const jsonSchema = jsonSchemaFromShorthand(meta.schema as ShorthandObject, ns);

    if(isCodyError(jsonSchema)) {
      return jsonSchema;
    }

    meta.schema = jsonSchema;
  }

  meta.schema['$id'] = definitionId(vo, ns, ctx);

  meta.schema = addPropertySchemaIds(meta.schema, meta.schema.$id);

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



  let normalizedSchema = normalizeRefs(addSchemaTitles(vo.getName(), meta.schema), service) as JSONSchema7;

  if(isRefSchema(normalizedSchema as any)) {
    const resolvedInfo = resolveRef(normalizedSchema as RefSchema, normalizedSchema, vo);

    if(isCodyError(resolvedInfo)) {
      return resolvedInfo;
    }

    if(isListDescription(resolvedInfo.desc)) {
      normalizedSchema = {
        $id: (normalizedSchema as any).$id,
        title: (normalizedSchema as any).title,
        type: "array",
        items: {
          $ref: definitionIdFromFQCN(resolvedInfo.desc.itemType)
        }
      }
    }
  }

  const hasIdentifier = !!meta.identifier;
  const isQueryable = !!meta.querySchema;

  let isNotStored = false;

  if(typeof meta.collection === "boolean" && !meta.collection) {
    isNotStored = true;
  }

  const staticView = !!meta.staticView;

  const convertedMeta: ValueObjectMetadata = {
    schema: normalizedSchema,
    ns,
    service,
    isList: isListSchema(normalizedSchema) || isInlineItemsArraySchema(normalizedSchema),
    hasIdentifier,
    isQueryable,
    staticView,
  }

  if(hasIdentifier) {
    convertedMeta.identifier = meta.identifier;
  }

  if(meta.initialize) {
    convertedMeta.initialize = meta.initialize;
  }

  if(meta.uiSchema) {
    convertedMeta.uiSchema = normalizeServerUiSchema(meta.uiSchema, getDefaultService(ctx));
  }

  if(meta.resolve) {
    convertedMeta.resolve = meta.resolve;
    convertedMeta.resolveRulesOnly = meta.resolveRulesOnly;
  }

  if(typeof meta.collection === "string") {
    convertedMeta.collection = meta.collection;
  }

  if(isListSchema(normalizedSchema)) {
    const refVORuntimeInfo = resolveRef(normalizedSchema.items, normalizedSchema, vo);
    if(isCodyError(refVORuntimeInfo)) {
      return refVORuntimeInfo;
    }

    convertedMeta.itemType = refVORuntimeInfo.desc.name;

    if(isQueryable) {
      if(isStateDescription(refVORuntimeInfo.desc)) {
        convertedMeta.hasIdentifier = true;
        convertedMeta.identifier = refVORuntimeInfo.desc.identifier;
      }

      if(isQueryableStateDescription(refVORuntimeInfo.desc) && !isNotStored && !convertedMeta.collection) {
        convertedMeta.collection = refVORuntimeInfo.desc.collection;
      }
    }
  }

  if(isInlineItemsArraySchema(normalizedSchema)) {
    if(meta.identifier) {
      convertedMeta.hasIdentifier = true;
      convertedMeta.identifier = meta.identifier;
    }

    const listFQCN = FQCNFromDefinitionId((convertedMeta.schema as any)['$id'] as string);
    const itemLabel = toSingularItemName(nodeLabelFromFQCN(listFQCN));

    convertedMeta.itemType =  renameFQCN(listFQCN, itemLabel);
  }

  if(isQueryable) {
    convertedMeta.querySchema = normalizeRefs(meta.querySchema, service) as JSONSchema7;
    if(!convertedMeta.collection && convertedMeta.hasIdentifier && (typeof meta.collection === "undefined" || typeof meta.collection === "string")) {
      convertedMeta.collection = meta.collection || voNames.constantName.toLowerCase() + '_collection';
    }

    if(!convertedMeta.collection && typeof meta.collection === "string") {
      convertedMeta.collection = meta.collection;
    }
  }

  convertedMeta.isNotStored = isNotStored;

  if(meta.queryDependencies) {
    convertedMeta.queryDependencies = meta.queryDependencies;
  }

  if(meta.projection) {
    convertedMeta.projection = normalizeProjectionConfig(meta.projection, FQCNFromDefinitionId((convertedMeta.schema as any)['$id'] as string))
  }

  return convertedMeta;
}
