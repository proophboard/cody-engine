import {FocusedElement} from "@cody-play/state/focused-element";
import {PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {getFocusedStateVO} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-state-v-o";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {isQueryableStateDescription} from "@event-engine/descriptions/descriptions";

export const isStateViewFocused = (focusedElement: FocusedElement | undefined, page: PlayPageDefinition, config: CodyPlayConfig): boolean => {
  const stateVO = getFocusedStateVO(focusedElement, page, config);

  if(playIsCodyError(stateVO)) {
    return false;
  }

  return isQueryableStateDescription(stateVO.desc);
}
