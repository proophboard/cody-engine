import {FocusedElement} from "@cody-play/state/focused-element";
import {PlayInformationRuntimeInfo, PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CodyResponse} from "@proophboard/cody-types";
import {isQueryableStateDescription} from "@event-engine/descriptions/descriptions";
import {getFocusedVo} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-vo";

export const getFocusedStateVO = (focusedElement: FocusedElement | undefined, page: PlayPageDefinition, config: CodyPlayConfig): PlayInformationRuntimeInfo | CodyResponse => {
  return getFocusedVo(focusedElement, page, config, (t) => isQueryableStateDescription(t.desc), 'queryable state');
}
