import {camelCaseToTitle} from "@frontend/util/string";
import {names} from "@event-engine/messaging/helpers";
import {JSONSchema7} from "json-schema";
import {snakeCaseToCamelCase} from "@cody-play/infrastructure/utils/string";

export const mapPropertiesToTitles = (schema: JSONSchema7, property?: string): JSONSchema7 => {
  const schemaCopy = JSON.parse(JSON.stringify(schema));

  if(property && !schema.title) {
    schemaCopy.title = camelCaseToTitle(snakeCaseToCamelCase(property));
  }

  if(schema.type && schema.type === 'object' && schema.properties) {
    Object.keys(schema.properties).forEach(key => {
      const propSchema = schema.properties![key];
      schemaCopy.properties[key] = mapPropertiesToTitles(propSchema as JSONSchema7, key);
    })
  }

  if(schema.type && schema.type === 'array' && schema.items) {
    schemaCopy.items = mapPropertiesToTitles(schema.items as JSONSchema7);
  }

  return schemaCopy;
}

export const playAddSchemaTitles = (elementName: string, schema: JSONSchema7): JSONSchema7 => {
  const schemaWithTitles = mapPropertiesToTitles(schema as any);

  if(!schemaWithTitles.title) {
    schemaWithTitles.title = camelCaseToTitle(names(elementName).className);
  }

  return schemaWithTitles as JSONSchema7;
}
