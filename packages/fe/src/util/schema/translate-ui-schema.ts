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

  const translateUiOptions = (
    uiOptions:Record<string, any>
  ) => {
    if(typeof uiOptions !== "object") {
      return uiOptions;
    }

    for (const schemaKey in uiOptions) {
      if (schemaKey.endsWith(':t')) {
        const uiKey = schemaKey.slice(0, -2);
        uiOptions[uiKey] = t(uiOptions[schemaKey], {
          defaultValue: uiOptions[uiKey] || uiOptions[schemaKey]
        });
        continue;
      }

      if(typeof uiOptions[schemaKey] === "object") {
        if(Array.isArray(uiOptions[schemaKey])) {
          uiOptions[schemaKey] = uiOptions[schemaKey].map(translateUiOptions);
        } else {
          uiOptions[schemaKey] = translateUiOptions(uiOptions[schemaKey]);
        }
      }
    }

    return uiOptions;
  };

  for (const schemaKey in translatedSchema) {
    if (!schemaKey.startsWith('ui:')) {
      continue;
    }

    if (schemaKey.startsWith('ui:options')) {
      translatedSchema['ui:options'] = translateUiOptions(translatedSchema['ui:options']!);
      continue;
    }

    if (schemaKey.endsWith(':t')) {
      const uiKey = schemaKey.slice(0, -2);
      translatedSchema[uiKey] = t(translatedSchema[schemaKey], {
        defaultValue: translatedSchema[uiKey] || translatedSchema[schemaKey]
      });
    }
  }

  return translatedSchema;
};
