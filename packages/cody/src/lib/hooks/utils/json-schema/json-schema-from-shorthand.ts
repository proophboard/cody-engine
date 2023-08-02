import {
  convertShorthandObjectToJsonSchema,
  convertShorthandStringToJsonSchema,
  ShorthandObject
} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {JSONSchema} from "json-schema-to-typescript";
import {CodyResponse} from "@proophboard/cody-types";
import {isCodyError} from "@proophboard/cody-utils";
import {replace} from "lodash";

const normalizeShorthandString = (shorthand: string): string => {
  shorthand = shorthand.replace('string|enum:', 'enum:');
  return shorthand;
}

const normalizeShorthandObject = (shorthand: ShorthandObject): ShorthandObject => {
  for (const shorthandKey in shorthand) {
    if(typeof shorthand[shorthandKey] === "string") {
      shorthand[shorthandKey] = normalizeShorthandString(shorthand[shorthandKey] as string);
    } else {
      shorthand[shorthandKey] = normalizeShorthandObject(shorthand[shorthandKey] as ShorthandObject);
    }
  }

  return shorthand;
}

const normalizeDataReference = (schema: any): JSONSchema | CodyResponse => {
  if(isCodyError(schema)) {
    return schema;
  }

  if(schema.type && schema.type === "object" && schema.properties) {
    for (const propertiesKey in schema.properties) {
      schema.properties[propertiesKey] = normalizeDataReference(schema.properties[propertiesKey]);
    }

    return schema as JSONSchema;
  }

  if(schema.type && schema.type === "array" && schema.items) {
    schema.items = normalizeDataReference(schema.items);

    return schema as JSONSchema;
  }

  for (const schemaKey in schema) {
    if(schemaKey === "$ref" || schemaKey === "$id") {
      continue;
    }

    if(schemaKey[0] === "$") {
      schema[schemaKey.slice(1)] = {$data: schema[schemaKey]};
      delete schema[schemaKey];
    }
  }

  return schema as JSONSchema;
}

export const jsonSchemaFromShorthand = (shorthand: string | ShorthandObject, namespace: string): JSONSchema | CodyResponse => {
  if(typeof shorthand === "string") {
    return convertShorthandStringToJsonSchema(normalizeShorthandString(shorthand), namespace);
  }

  if(shorthand["$type"] && typeof shorthand["$type"] === "string") {
    const schema = convertShorthandStringToJsonSchema(normalizeShorthandString(shorthand["$type"]), namespace);

    if(isCodyError(schema)) {
      return schema;
    }

    if(shorthand["$title"] && typeof shorthand['$title'] === "string") {
      schema['title'] = shorthand['$title'];
    }

    return schema;
  }

  return convertShorthandObjectToJsonSchema(normalizeShorthandObject(shorthand), namespace);
}
