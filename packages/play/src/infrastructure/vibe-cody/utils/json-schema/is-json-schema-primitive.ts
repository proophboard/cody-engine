import {JSONSchema7, JSONSchema7TypeName} from "json-schema";
import {PRIMITIVE_SCHEMA_TYPES} from "./is-json-schema";

export const isJsonSchemaPrimitive = (schema: JSONSchema7): boolean => {
  return !!schema.type && typeof schema.type === "string" && PRIMITIVE_SCHEMA_TYPES.includes(schema.type as JSONSchema7TypeName);
}
