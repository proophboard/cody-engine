import {JSONSchema7} from "json-schema";

export const isJsonSchemaString = (schema: JSONSchema7, format?: string): boolean => {
  if(schema.type && schema.type === "string") {
    if(format) {
      return !!schema.format && schema.format === format;
    }

    return true;
  }

  return false;
}
