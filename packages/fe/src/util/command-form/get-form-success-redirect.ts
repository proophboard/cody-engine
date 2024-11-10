import {PlayCommandRuntimeInfo} from "@cody-play/state/types";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import jexl from "@app/shared/jexl/get-configured-jexl";

export const getFormSuccessRedirect = (commandInfo: PlayCommandRuntimeInfo | CommandRuntimeInfo, ctx: any): string | null => {
  const uiSchema = commandInfo.uiSchema;

  if(!uiSchema || !uiSchema['ui:form'] || typeof uiSchema['ui:form'] !== "object") {
    return null;
  }

  const uiForm = {...uiSchema['ui:form']};

  if(uiForm.successRedirect) {
    return uiForm.successRedirect;
  }

  if(uiForm['successRedirect:expr']) {
    return jexl.evalSync(uiForm['successRedirect:expr'], ctx);
  }

  return null;
}
