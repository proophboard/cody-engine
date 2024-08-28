import {isObjectSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-object-schema";
import {JSONSchema7} from "json-schema-to-ts";
import {isInlineItemsArraySchema} from "@app/shared/utils/schema-checks";

export const addPropertySchemaIds = (schema: JSONSchema7, rootId: string): JSONSchema7 => {
  if(isInlineItemsArraySchema(schema)) {
    (schema as any).items = addPropertySchemaIds(schema.items as JSONSchema7, rootId + 'Item');
    return schema;
  }

  if(!isObjectSchema(schema)) {
    return schema;
  }

  const properties = schema.properties || {};

  for (const prop in properties) {
    (properties[prop] as any)['$id'] = `${rootId}:${prop}`;
  }

  return schema;
}
