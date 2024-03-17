import {isObjectSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-object-schema";
import {JSONSchema7} from "json-schema-to-ts";

export const addPropertySchemaIds = (schema: JSONSchema7, rootId: string): JSONSchema7 => {
  if(!isObjectSchema(schema)) {
    return schema;
  }

  const properties = schema.properties || {};

  for (const prop in properties) {
    (properties[prop] as any)['$id'] = `${rootId}:${prop}`;
  }

  return schema;
}
