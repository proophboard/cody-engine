import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {camelCaseToTitle} from "@frontend/util/string";
import {UiSchema} from "@rjsf/utils";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";

export const informationTitle = (info: PlayInformationRuntimeInfo | ValueObjectRuntimeInfo, uiSchema?: UiSchema): string => {
  let uiTitle;

  if(!uiSchema) {
    uiSchema = info.uiSchema;
  }

  if(uiSchema) {
    if(uiSchema['ui:title']) {
      uiTitle = uiSchema['ui:title'];
    }

    if(!uiTitle && uiSchema['ui:options'] && uiSchema['ui:options'].title) {
      uiTitle = uiSchema['ui:options'].title;
    }
  }

  const title = uiTitle || info.schema.title || info.desc.name;

  if(title === info.desc.name) {
    const parts = info.desc.name.split(".");
    return camelCaseToTitle(parts[parts.length -1]);
  }

  return title as string;
}
