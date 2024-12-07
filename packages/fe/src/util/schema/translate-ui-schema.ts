import {UiSchema} from "@rjsf/utils";
import {TFunction} from "i18next";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";

export const translateUiSchema = (schema: UiSchema, key: string, t: TFunction): UiSchema => {
  const translatedSchema = cloneDeepJSON(schema);

  if(typeof translatedSchema !== "object" || Array.isArray(translatedSchema)) {
    return translatedSchema;
  }

  for (const schemaKey in schema) {
    if(typeof schema[schemaKey] === "object") {
      schema[schemaKey] = translateUiSchema(schema[schemaKey], `${key}.${schemaKey}`, t);
    }
  }

  if(translatedSchema['ui:title']) {
    translatedSchema['ui:title'] = t(`type.${key}.title`, {defaultValue: translatedSchema['ui:title']});
  }

  if(translatedSchema['ui:description']) {
    translatedSchema['ui:description'] = t(`type.${key}.description`, {defaultValue: translatedSchema['ui:description']});
  }

  if(translatedSchema['ui:help']) {
    translatedSchema['ui:help'] = t(`type.${key}.help`, {defaultValue: translatedSchema['ui:help']});
  }

  if(translatedSchema['ui:options']) {
    const uiOptions = translatedSchema['ui:options'];

    if(uiOptions.title) {
      uiOptions.title = t(`type.${key}.title`, {defaultValue: uiOptions.title});
    }

    if(uiOptions.description) {
      uiOptions.description = t(`type.${key}.description`, {defaultValue: uiOptions.description});
    }

    if(uiOptions.help) {
      uiOptions.help = t(`type.${key}.help`, {defaultValue: uiOptions.help});
    }

    translatedSchema['ui:options'] = uiOptions;
  }

  return translatedSchema;
}
