import {PlayCommandRuntimeInfo} from "@cody-play/state/types";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import jexl from "@app/shared/jexl/get-configured-jexl";

export const getInitialValues = (commandInfo: PlayCommandRuntimeInfo | CommandRuntimeInfo, ctx: any): {[prop: string]: any} => {
  let values: {[prop: string]: any} = {};

  const uiSchema = commandInfo.uiSchema;

  if(!uiSchema || !uiSchema['ui:form'] || typeof uiSchema['ui:form'] !== "object") {
    return values;
  }

  const uiForm = {...uiSchema['ui:form']};

  if(uiForm.data) {
    if(typeof uiForm.data === "string") {
      uiForm['data:expr'] = uiForm.data;
    } else if (typeof uiForm.data === "object") {
      for (const prop in uiForm.data) {
        if(typeof uiForm.data[prop] === "string") {
          values[prop] = jexl.evalSync(uiForm.data[prop], ctx);
        }
      }
    }
  }

  if(uiForm['data:expr']) {
    values = jexl.evalSync(uiForm['data:expr'], ctx);
  }

  if(typeof values !== "object" || commandInfo.schema.type !== "object") {
    return {}
  }

  const schemaProps = commandInfo.schema.properties || {};
  const schemaPropKeys = Object.keys(schemaProps);

  const filteredValues: {[prop: string]: any} = {};

  for (const valProp in values) {
    if(schemaPropKeys.includes(valProp)) {
      filteredValues[valProp] = values[valProp];
    }
  }

  return filteredValues;
}
