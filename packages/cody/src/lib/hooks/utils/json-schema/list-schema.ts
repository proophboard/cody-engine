import {isRefSchema, RefSchema} from "./ref-schema";
import {JSONSchema7} from "json-schema-to-ts";

export interface ListSchema {
  type: "array";
  items: RefSchema;
}

export const isListSchema = (schema: JSONSchema7): schema is ListSchema => {
  return schema['type'] && schema['type'] === "array" && schema['items'] && isRefSchema(schema['items']);
}
