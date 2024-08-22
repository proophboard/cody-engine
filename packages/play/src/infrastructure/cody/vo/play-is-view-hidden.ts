import {PlayInformationRuntimeInfo} from "@cody-play/state/types";

export const playIsViewHidden = (view: PlayInformationRuntimeInfo): boolean => {
  if(!view.uiSchema) {
    return false;
  }

  if(!view.uiSchema['ui:hidden']) {
    return false;
  }

  return view.uiSchema['ui:hidden'] === true;
}
