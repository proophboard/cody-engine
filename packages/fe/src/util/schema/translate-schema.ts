import {TFunction} from "i18next";
import {cloneSchema} from "@event-engine/messaging/resolve-refs";
import {JSONSchema7} from "json-schema";

export const translateSchema = (schema: JSONSchema7, key: string, t: TFunction): JSONSchema7 => {
  const translatedSchema = cloneSchema(schema);

  if(typeof translatedSchema !== "object" || Array.isArray(translatedSchema)) {
    return translatedSchema;
  }

  if(translatedSchema.properties) {
    for (const prop in translatedSchema.properties) {
      translatedSchema.properties[prop] = translateSchema(translatedSchema.properties[prop] as JSONSchema7, `${key}.${prop}`, t);
    }
  }

  if(translatedSchema.items) {
    translatedSchema.items = translateSchema(translatedSchema.items as JSONSchema7, `${key}.items`, t);
  }

  if(translatedSchema.oneOf) {
    translatedSchema.oneOf.forEach((s, i) => {
      translatedSchema.oneOf![i] = translateSchema(s as JSONSchema7, key, t);
    })
  }

  if(translatedSchema.anyOf) {
    translatedSchema.anyOf.forEach((s, i) => {
      translatedSchema.anyOf![i] = translateSchema(s as JSONSchema7, key, t);
    })
  }

  if(translatedSchema.allOf) {
    translatedSchema.allOf.forEach((s, i) => {
      translatedSchema.allOf![i] = translateSchema(s as JSONSchema7, key, t);
    })
  }

  if(translatedSchema.title) {
    translatedSchema.title = t(`type.${key}.title`, {defaultValue: translatedSchema.title});
  }

  if(translatedSchema.description) {
    translatedSchema.description = t(`type.${key}.description`, {defaultValue: translatedSchema.description});
  }

  return translatedSchema;
}
