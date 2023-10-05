import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {camelCaseToTitle} from "@frontend/util/string";

export const informationTitle = (info: PlayInformationRuntimeInfo): string => {
  let uiTitle;

  if(info.uiSchema) {
    if(info.uiSchema['ui:title']) {
      uiTitle = info.uiSchema['ui:title'];
    }

    if(!uiTitle && info.uiSchema['ui:options'] && info.uiSchema['ui:options'].title) {
      uiTitle = info.uiSchema['ui:options'].title;
    }
  }

  const title = uiTitle || info.schema.title || info.desc.name;

  if(title === info.desc.name) {
    const parts = info.desc.name.split(".");
    return camelCaseToTitle(parts[parts.length -1]);
  }

  return title as string;
}
