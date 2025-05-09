import {UiSchema} from "@rjsf/utils";

export const showTitle = (uiSchema?: UiSchema): boolean => {
  if(!uiSchema) {
    return true;
  }

  if(typeof uiSchema['ui:title'] === "boolean") {
    return uiSchema['ui:title'];
  }

  if(typeof uiSchema['ui:title'] === "string" && uiSchema['ui:title'] === '') {
    return false;
  }

  if(uiSchema['ui:options'] && typeof uiSchema['ui:options']['title'] === "boolean") {
    return uiSchema['ui:options']['title'];
  }

  return true;
}
