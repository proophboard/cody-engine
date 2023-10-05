import {JSONSchema7} from "json-schema";

export interface RefSchema {
  "$ref": string;
}

export const isRefSchema = (schema: JSONSchema7): schema is RefSchema => {
  return typeof schema === "object" && typeof schema["$ref"] === "string";
}

export interface ListSchema {
  type: "array";
  items: RefSchema;
}

export const isListSchema = (schema: any): schema is ListSchema => {
  return !!schema['type'] && schema['type'] === "array" && schema['items'] && isRefSchema(schema['items']);
}
