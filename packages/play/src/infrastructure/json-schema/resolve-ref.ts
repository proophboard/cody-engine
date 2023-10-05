import {PlaySchemaDefinitions} from "@cody-play/state/types";
import {JSONSchema7} from "json-schema";

export interface RefSchema {
  "$ref": string;
}

export const isRefSchema = (schema: JSONSchema7): schema is RefSchema => {
  return typeof schema === "object" && typeof schema["$ref"] === "string";
}

export const resolveRef = (schema: JSONSchema7, definitions: PlaySchemaDefinitions): JSONSchema7 => {
  if(isRefSchema(schema)) {
    const refSchema = definitions[schema.$ref];

    if(!refSchema) {
      throw new Error(`Cannot resolve JSON Schema reference "${schema.$ref}". It's not registered.`);
    }

    return refSchema as JSONSchema7;
  }

  return schema;
}
