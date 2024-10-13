import {PlayCommandRuntimeInfo} from "@cody-play/state/types";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {execMappingSync} from "@cody-play/infrastructure/rule-engine/make-executable";

export const getInitialValues = (commandInfo: PlayCommandRuntimeInfo | CommandRuntimeInfo, ctx: any): {[prop: string]: unknown} => {
  let values: {[prop: string]: any} = {};

  const uiSchema = commandInfo.uiSchema;

  if(!uiSchema || !uiSchema['ui:form'] || typeof uiSchema['ui:form'] !== "object") {
    return values;
  }

  const uiForm = {...uiSchema['ui:form']};

  if(uiForm.data) {
    uiForm['data:expr'] = uiForm.data;
  }

  if(uiForm['data:expr']) {
    values = execMappingSync(uiForm['data:expr'], ctx);
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
