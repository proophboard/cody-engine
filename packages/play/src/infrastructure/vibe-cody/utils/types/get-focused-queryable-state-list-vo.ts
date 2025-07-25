import {FocusedElement} from "@cody-play/state/focused-element";
import {PlayInformationRuntimeInfo, PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CodyResponse} from "@proophboard/cody-types";
import {getFocusedVo} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-vo";
import {isTableDescription} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-description";

export const getFocusedQueryableStateListVo = (focusedElement: FocusedElement | undefined, page: PlayPageDefinition, config: CodyPlayConfig): PlayInformationRuntimeInfo | CodyResponse => {
  return getFocusedVo(focusedElement, page, config, (t) => isTableDescription(t.desc), 'queryable state list');
}
