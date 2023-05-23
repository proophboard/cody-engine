import {JSONSchema7} from "json-schema-to-ts";

export interface ObjectSchema {
  type: "object",
  properties: {[propName: string]: JSONSchema7},
  additionalProperties: boolean,
  required: string[]
}

export const objectSchema = (schema: JSONSchema7): schema is ObjectSchema => {
  return schema['type'] && schema['type'] === "object";
}
