import {JSONSchema7, JSONSchema7TypeName} from "json-schema";

export const isJsonSchemaRef = (schema: JSONSchema7): boolean => {
  return !!schema.$ref;
}
