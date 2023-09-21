import {PlaySchemaDefinitions} from "@cody-play/state/types";
import {isRefSchema} from "@cody-engine/cody/hooks/utils/json-schema/ref-schema";
import {JSONSchema7} from "json-schema-to-ts";

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
