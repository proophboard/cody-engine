import {JSONSchema7} from "json-schema";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import {UiSchema} from "@rjsf/utils";
import {names} from "@event-engine/messaging/helpers";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";

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

export const resolveUiSchema = (schema: JSONSchema7, types: { [valueObjectName: string]: ValueObjectRuntimeInfo }): UiSchema | undefined => {
  if(schema['$ref']) {

    const isPropRef = isPropertyRef(schema['$ref']);
    const [ref, prop] = isPropRef ? splitPropertyRef(schema['$ref']) : [schema['$ref'], ''];

    const fqcn = FQCNFromDefinitionId(ref);

    const refUiSchema = types[fqcn]?.uiSchema;

    if(refUiSchema && Object.keys(refUiSchema).length > 0) {
      if(!isPropRef) {
        return refUiSchema;
      }

      return refUiSchema[prop];
    }

    return undefined;
  }

  const uiSchema: UiSchema = {};

  if(schema && schema.properties) {
    for (const prop in schema.properties) {
      const propUiSchema = resolveUiSchema(schema.properties[prop] as JSONSchema7, types);

      if(propUiSchema) {
        uiSchema[prop] = propUiSchema;
      }
    }
  }

  if(schema && schema.items) {
    const itemsUiSchema = resolveUiSchema(schema.items as JSONSchema7, types);

    if(itemsUiSchema) {
      uiSchema['items'] = itemsUiSchema;
    }
  }

  return Object.keys(uiSchema).length > 0 ? uiSchema : undefined;
}

export const resolveRefs = (schema: JSONSchema7, definitions: {[id: string]: DeepReadonly<JSONSchema7>}, isNested?: boolean): JSONSchema7 => {
  if(schema['$ref']) {
    const isPropRef = isPropertyRef(schema['$ref']);
    const [ref, prop] = isPropRef ? splitPropertyRef(schema['$ref']) : [schema['$ref'], ''];

    if(definitions[ref]) {
      let resolvedSchema = cloneSchema(definitions[ref] as Writable<JSONSchema7>);

      // Remove $id from resolved schema to avoid ajv complaining about ambiguous schemas
      if(typeof resolvedSchema['$id'] !== 'undefined' && isNested) {
        delete resolvedSchema['$id'];
      }

      if(resolvedSchema.type && (resolvedSchema.type === 'object' || resolvedSchema.type === 'array')) {
        resolvedSchema = resolveRefs(resolvedSchema, definitions);
      }

      if(isPropRef) {
        if(!resolvedSchema.type || resolvedSchema.type !== "object" || !resolvedSchema.properties || typeof resolvedSchema.properties[prop] === "undefined") {
          throw new Error(`The reference "${schema['$ref']}" cannot be resolved. Property "${prop}" is not found in the resolved schema of "${ref}"!`);
        }

        return resolvedSchema.properties[prop] as JSONSchema7;
      }

      return resolvedSchema as JSONSchema7;
    }
    throw new Error(`The reference "${schema['$ref']}" cannot be resolved. It is not listed in types/definitions.ts!`);
  }

  if(schema && schema.properties) {
    for (const prop in schema.properties) {
      schema.properties[prop] = resolveRefs(schema.properties[prop] as JSONSchema7, definitions, true);
    }
  }

  if(schema && schema.items) {
    schema.items = resolveRefs(schema.items as JSONSchema7, definitions, true);
  }

  return schema;
}
