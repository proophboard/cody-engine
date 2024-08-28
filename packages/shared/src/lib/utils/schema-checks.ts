import {JSONSchema7} from "json-schema";
import {isRefSchema, RefSchema} from "@app/shared/utils/json-schema/is-ref-schema";

export interface ListSchema {
  type: "array";
  items: RefSchema;
}

export const isListSchema = (schema: any): schema is ListSchema => {
  return !!schema['type'] && schema['type'] === "array" && schema['items'] && isRefSchema(schema['items']);
}

export interface InlineItemsArraySchema {
  type: "array";
  items: JSONSchema7;
  title?: string;
}

export const isInlineItemsArraySchema = (schema: any): schema is InlineItemsArraySchema => {
  return !!schema['type'] && schema['type'] === "array" && schema['items'] && !isRefSchema(schema['items']);
}

export interface ObjectSchema {
  type: "object",
  properties: {[propName: string]: JSONSchema7},
  additionalProperties: boolean,
  required: string[]
}

export const isObjectSchema = (schema: any): schema is ObjectSchema => {
  return schema['type'] && schema['type'] === "object";
}
