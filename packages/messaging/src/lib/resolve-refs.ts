import {JSONSchema7} from "json-schema";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import {UiSchema} from "@rjsf/utils";
import {names} from "@event-engine/messaging/helpers";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {merge} from "lodash/fp";

export type UiSchemaTFunction = (uiSchema: UiSchema, key: string) => UiSchema;
export type JsonSchemaTFunction = (schema: JSONSchema7, key: string) => JSONSchema7;


const cloneDeepJSON = <T>(val: T): T => {
  return JSON.parse(JSON.stringify(val));
}

const FQCNFromDefinitionId = (definitionId: string): string => {
  const withoutPrefix = definitionId.replace('/definitions/', '');

  const fqcnParts = withoutPrefix.split("/");

  return fqcnParts.map(p => names(p).className).join(".");
}

export const cloneSchema = (schema: JSONSchema7): JSONSchema7 => {
  return JSON.parse(JSON.stringify(schema));
}

export const isPropertyRef = (ref: string): boolean => {
  return ref.indexOf(':') !== -1;
}

export const splitPropertyRef = (ref: string): [string, string] => {
  const split = ref.split(':');

  if(split.length === 1) {
    split.push('');
  }
  return split as [string, string];
}

export const resolveUiSchema = (schema: JSONSchema7, types: { [valueObjectName: string]: ValueObjectRuntimeInfo }, t: UiSchemaTFunction): UiSchema | undefined => {
  let uiSchema: UiSchema = {};
  if(schema['$ref']) {

    const isPropRef = isPropertyRef(schema['$ref']);
    const [ref, prop] = isPropRef ? splitPropertyRef(schema['$ref']) : [schema['$ref'], ''];

    const fqcn = FQCNFromDefinitionId(ref);

    const refSchema = types[fqcn]?.schema;

    if(refSchema) {
      schema = cloneDeepJSON(refSchema as JSONSchema7);
    }

    const refUiSchema = types[fqcn]?.uiSchema;

    if(refUiSchema && Object.keys(refUiSchema).length > 0) {
      if(!isPropRef) {
        uiSchema = t(refUiSchema, `${fqcn}.uiSchema`);
      } else {
        uiSchema = t(refUiSchema[prop] || {}, `${fqcn}.${prop}.uiSchema`);
      }
    }
  }

  if(schema && schema.properties) {
    for (const prop in schema.properties) {
      const propUiSchema = resolveUiSchema(schema.properties[prop] as JSONSchema7, types, t);

      if(propUiSchema) {
        uiSchema[prop] = uiSchema[prop]? {...uiSchema[prop], ...propUiSchema} : propUiSchema;
      }
    }
  }

  if(schema && schema.items) {
    const itemsUiSchema = resolveUiSchema(schema.items as JSONSchema7, types, t);

    if(itemsUiSchema) {
      uiSchema['items'] = uiSchema['items']? {...uiSchema['items'], ...itemsUiSchema} : itemsUiSchema;
    }
  }

  return Object.keys(uiSchema).length > 0 ? uiSchema : undefined;
}

const withOriginalTitle = (resolvedSchema: JSONSchema7, originalTitle?: string): JSONSchema7 => {
  if(!originalTitle) {
    return resolvedSchema;
  }

  return merge(resolvedSchema, {title: originalTitle})
}

export const resolveRefs = (schema: JSONSchema7, definitions: {[id: string]: DeepReadonly<JSONSchema7>}, isNested?: boolean, t?: JsonSchemaTFunction): JSONSchema7 => {
  schema = cloneSchema(schema);

  if(schema['$ref']) {
    const isPropRef = isPropertyRef(schema['$ref']);
    const [ref, prop] = isPropRef ? splitPropertyRef(schema['$ref']) : [schema['$ref'], ''];

    if(definitions[ref]) {
      let resolvedSchema = cloneSchema(definitions[ref] as Writable<JSONSchema7>);

      // Remove $id from resolved schema to avoid ajv complaining about ambiguous schemas
      if(typeof resolvedSchema['$id'] !== 'undefined' && isNested) {
        delete resolvedSchema['$id'];
      }

      if(t) {
        const refFQCN = FQCNFromDefinitionId(ref);
        resolvedSchema = t(resolvedSchema, `${refFQCN}.schema`);
      }

      if(resolvedSchema.type && (resolvedSchema.type === 'object' || resolvedSchema.type === 'array')) {
        resolvedSchema = resolveRefs(resolvedSchema, definitions, isNested, t);
      }

      if(isPropRef) {
        if(!resolvedSchema.type || resolvedSchema.type !== "object" || !resolvedSchema.properties || typeof resolvedSchema.properties[prop] === "undefined") {
          throw new Error(`The reference "${schema['$ref']}" cannot be resolved. Property "${prop}" is not found in the resolved schema of "${ref}"!`);
        }

        return withOriginalTitle(resolvedSchema.properties[prop] as JSONSchema7, schema.title);
      }

      return withOriginalTitle(resolvedSchema as JSONSchema7, schema.title);
    }
    throw new Error(`The reference "${schema['$ref']}" cannot be resolved. It is not listed in types/definitions.ts!`);
  }

  if(schema && schema.properties) {
    for (const prop in schema.properties) {
      schema.properties[prop] = resolveRefs(schema.properties[prop] as JSONSchema7, definitions, true, t);
    }
  }

  if(schema && schema.items) {
    schema.items = resolveRefs(schema.items as JSONSchema7, definitions, true, t);
  }

  // Remove $id from resolved schema to avoid ajv complaining about ambiguous schemas
  if(typeof schema['$id'] !== 'undefined' && isNested) {
    delete schema['$id'];
  }

  return schema;
}
