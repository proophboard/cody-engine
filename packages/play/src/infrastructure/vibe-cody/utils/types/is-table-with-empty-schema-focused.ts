import {FocusedElement} from "@cody-play/state/focused-element";
import {PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {isQueryableStateListDescription, QueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {get} from "lodash";

export const isTableWithEmptySchemaFocused = (focusedElement: FocusedElement | undefined, page: PlayPageDefinition, config: CodyPlayConfig): boolean => {
  const tableVO = getFocusedQueryableStateListVo(focusedElement, page, config);

  if(playIsCodyError(tableVO)) {
    return false;
  }

  if(!isQueryableStateListDescription(tableVO.desc)) {
    return false;
  }

  const itemType = tableVO.desc.itemType;

  const itemVO = config.types[itemType];

  if(!itemVO) {
    return false;
  }

  const itemProps = get(itemVO.schema, 'properties', {});

  return Object.keys(itemProps).filter(p => p !== (tableVO.desc as QueryableStateListDescription).itemIdentifier).length === 0;
}
