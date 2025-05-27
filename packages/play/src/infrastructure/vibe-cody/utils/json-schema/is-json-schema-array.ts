import {JSONSchema7} from "json-schema";

export const isJsonSchemaArray = (schema: Record<string, any>): schema is JSONSchema7 => {
  if(typeof schema !== "object") {
    return false;
  }

  return schema.type && schema.type === "array";
}
