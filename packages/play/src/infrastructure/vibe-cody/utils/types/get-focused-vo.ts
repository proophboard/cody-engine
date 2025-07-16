import {FocusedElement} from "@cody-play/state/focused-element";
import {PlayInformationRuntimeInfo, PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CodyResponse, CodyResponseType} from "@proophboard/cody-types";

export const getFocusedVo = (focusedElement: FocusedElement | undefined, page: PlayPageDefinition, config: CodyPlayConfig, match: (t: PlayInformationRuntimeInfo) => boolean, lookingFor: string): PlayInformationRuntimeInfo | CodyResponse => {
  if(focusedElement) {
    const stateVO = config.types[focusedElement!.id];

    if(!stateVO) {
      return {
        cody: `I can't find the information ${focusedElement!.id} in the types registry.`,
        details: `That seems to be a bug in Cody Play. Please contact the prooph board team!`,
        type: CodyResponseType.Error
      }
    }

    return stateVO;
  }

  if(!page.components.length) {
    return {
      cody: `I can't find an information, because page "${page.name}" has no view components configured`,
      type: CodyResponseType.Error
    };
  }

  const vos: PlayInformationRuntimeInfo[] = [];

  for (const component of page.components) {
    const viewName = typeof component === "string" ? component : component.view;

    const view = config.views[viewName];

    if(typeof view === "object" && view.information) {
      if(!config.types[view.information]) {
        continue;
      }

      const voRuntimeInfo = config.types[view.information];

      if(match(voRuntimeInfo)) {
        vos.push(voRuntimeInfo)
      }
    }
  }

  if(vos.length === 1) {
    return vos.pop() as PlayInformationRuntimeInfo;
  }

  return {
    cody: `I can't find a ${lookingFor} information on page "${page.name}".`,
    details: `This type of information is needed to execute your instruction. Contact the prooph board team to review your design.`,
    type: CodyResponseType.Error
  }
}
