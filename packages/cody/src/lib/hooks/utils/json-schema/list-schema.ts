import {isRefSchema, RefSchema} from "./ref-schema";

export interface ListSchema {
  type: "array";
  items: RefSchema;
}

export const isListSchema = (schema: any): schema is ListSchema => {
  return !!schema['type'] && schema['type'] === "array" && schema['items'] && isRefSchema(schema['items']);
}
