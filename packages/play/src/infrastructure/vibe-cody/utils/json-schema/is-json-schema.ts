import {JSONSchema7, JSONSchema7TypeName} from "json-schema";

export const SCHEMA_TYPES: JSONSchema7TypeName[] = ["object", "array", "string", "integer", "number", "boolean", "null"];
export const PRIMITIVE_SCHEMA_TYPES: JSONSchema7TypeName[] = ["string", "integer", "number", "boolean", "null"];

export const isJsonSchema = (schema: any): schema is JSONSchema7 => {
  if(typeof schema !== "object") {
    return false;
  }

  if(schema.type && !isValidType(schema.type)) {
    return false;
  }

  if(schema.$ref || schema.$id || schema.title) {
    return true;
  }

  return !Object.keys(schema).length;
}

const isValidType = (type: JSONSchema7TypeName | JSONSchema7TypeName[]): boolean => {
  if(Array.isArray(type)) {
    for (const typeElement of type) {
      if(!isValidType(typeElement)) {
        return false;
      }
    }
  }

  if(typeof type !== "string") {
    return false;
  }

  return SCHEMA_TYPES.includes(type);
}
