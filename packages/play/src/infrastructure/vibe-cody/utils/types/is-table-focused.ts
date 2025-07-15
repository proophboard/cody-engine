import {FocusedElement} from "@cody-play/state/focused-element";
import {PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";

export const isTableFocused = (focusedElement: FocusedElement | undefined, page: PlayPageDefinition, config: CodyPlayConfig): boolean => {
  const tableVO = getFocusedQueryableStateListVo(focusedElement, page, config);

  if(playIsCodyError(tableVO)) {
    return false;
  }

  return isQueryableStateListDescription(tableVO.desc);
}
