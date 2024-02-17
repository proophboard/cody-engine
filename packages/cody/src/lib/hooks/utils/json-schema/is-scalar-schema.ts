import {JSONSchema7} from "json-schema-to-ts";

export interface ScalarSchema {
  type: "string" | "number" | "boolean" | "integer",
  title?: "string"
}

const scalarTypes = ["string", "number", "boolean", "integer"];

export const isScalarSchema = (schema: any): schema is ScalarSchema => {
  return schema['type'] && scalarTypes.includes(schema['type']);
}
