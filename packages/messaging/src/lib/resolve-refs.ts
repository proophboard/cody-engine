import {JSONSchema7} from "json-schema";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";


export const cloneSchema = (schema: JSONSchema7): JSONSchema7 => {
  return JSON.parse(JSON.stringify(schema));
}

export const resolveRefs = (schema: JSONSchema7, definitions: {[id: string]: DeepReadonly<JSONSchema7>}): JSONSchema7 => {
  if(schema['$ref']) {
    if(definitions[schema['$ref']]) {
      let resolvedSchema = cloneSchema(definitions[schema['$ref']] as Writable<JSONSchema7>);

      if(resolvedSchema.type && (resolvedSchema.type === 'object' || resolvedSchema.type === 'array')) {
        resolvedSchema = resolveRefs(resolvedSchema, definitions);
      }
      return resolvedSchema as JSONSchema7;
    }
    throw new Error(`The reference "${schema['$ref']}" cannot be resolved. It is not listed in types/definitions.ts!`);
  }

  if(schema && schema.properties) {
    for (const prop in schema.properties) {
      schema.properties[prop] = resolveRefs(schema.properties[prop] as JSONSchema7, definitions);
    }
  }

  if(schema && schema.items) {
    schema.items = resolveRefs(schema.items as JSONSchema7, definitions);
  }

  return schema;
}
