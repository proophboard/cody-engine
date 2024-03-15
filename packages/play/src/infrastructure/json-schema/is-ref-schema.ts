import {JSONSchema7} from "json-schema";

export interface RefSchema {
  "$ref": string;
}

export const isRefSchema = (schema: JSONSchema7): schema is RefSchema => {
  return typeof schema === "object" && typeof schema["$ref"] === "string";
}
