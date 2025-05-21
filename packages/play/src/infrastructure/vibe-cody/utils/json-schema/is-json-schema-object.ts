import {JSONSchema7} from "json-schema";

export const isJsonSchemaObject = (schema: any): schema is JSONSchema7 => {
  if(typeof schema !== "object") {
    return false;
  }

  return schema.type && schema.type === "object";
}
