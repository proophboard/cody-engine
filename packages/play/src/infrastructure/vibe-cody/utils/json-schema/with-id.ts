import {JSONSchema7} from "json-schema";
import {playDefinitionIdFromFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";

export const withId = (schema: JSONSchema7, fqcn: string): JSONSchema7 => {
  if(!schema.$id) {
    schema.$id = playDefinitionIdFromFQCN(fqcn);
  }

  return schema;
}
