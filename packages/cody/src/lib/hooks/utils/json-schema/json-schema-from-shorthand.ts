import {
  convertShorthandObjectToJsonSchema,
  convertShorthandStringToJsonSchema,
  ShorthandObject
} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {JSONSchema} from "json-schema-to-typescript";
import {CodyResponse} from "@proophboard/cody-types";
import {isCodyError} from "@proophboard/cody-utils";
import {isObjectSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-object-schema";

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
