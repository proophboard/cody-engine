import {isRefSchema, RefSchema} from "@cody-play/infrastructure/json-schema/resolve-ref";

export interface ListSchema {
  type: "array";
  items: RefSchema;
}

export const isListSchema = (schema: any): schema is ListSchema => {
  return !!schema['type'] && schema['type'] === "array" && schema['items'] && isRefSchema(schema['items']);
}
