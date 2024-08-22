import {PlayCommandRuntimeInfo} from "@cody-play/state/types";

export const playIsCommandButtonHidden = (command: PlayCommandRuntimeInfo): boolean => {
  if(!command.uiSchema || !command.uiSchema['ui:button']) {
    return false;
  }

  const btnConfig = command.uiSchema['ui:button'];

  if(!btnConfig.hidden) {
    return false;
  }

  return btnConfig.hidden === true;
}
