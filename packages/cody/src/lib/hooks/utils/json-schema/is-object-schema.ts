import {JSONSchema7} from "json-schema-to-ts";

export interface ObjectSchema {
  type: "object",
  properties: {[propName: string]: JSONSchema7},
  additionalProperties: boolean,
  required: string[]
}

export const isObjectSchema = (schema: any): schema is ObjectSchema => {
  return schema['type'] && schema['type'] === "object";
}
