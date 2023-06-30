import {JSONSchema7} from "json-schema-to-ts";
import {mapPropertiesToTitles} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {camelCaseToTitle} from "@frontend/util/string";
import {names} from "@event-engine/messaging/helpers";

export const addSchemaTitles = (elementName: string, schema: JSONSchema7): JSONSchema7 => {
  const schemaWithTitles = mapPropertiesToTitles(schema as any);

  if(!schemaWithTitles.title) {
    schemaWithTitles.title = camelCaseToTitle(names(elementName).className);
  }

  return schemaWithTitles as JSONSchema7;
}
