import {PlayInformationRuntimeInfo, PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";

export const getAllTypesOnPage = (page: PlayPageDefinition, config: CodyPlayConfig): PlayInformationRuntimeInfo[] => {
  const types: PlayInformationRuntimeInfo[] = [];

  for (const component of page.components) {
    const viewName = typeof component === "string" ? component : component.view;

    const view = config.views[viewName];

    if(typeof view === "object" && view.information) {
      if(!config.types[view.information]) {
        continue;
      }

      const voRuntimeInfo = config.types[view.information];

      if(voRuntimeInfo) {
        types.push(voRuntimeInfo);
      }
    }
  }

  return types;
}
