import {FocusedElement} from "@cody-play/state/focused-element";
import {PlayPageDefinition} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  getFocusedQueryableStateListVo
} from "@cody-play/infrastructure/vibe-cody/utils/types/get-focused-queryable-state-list-vo";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription,
  ListDescription
} from "@event-engine/descriptions/descriptions";
import {get} from "lodash";
import {JSONSchema7} from "json-schema";
import {isTableDescription} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-description";

export const isTableWithFixedFilterPossibilitiesFocused = (focusedElement: FocusedElement | undefined, page: PlayPageDefinition, config: CodyPlayConfig): boolean => {
  const tableVO = getFocusedQueryableStateListVo(focusedElement, page, config);

  if(playIsCodyError(tableVO)) {
    return false;
  }

  if(!isTableDescription(tableVO.desc)) {
    return false;
  }

  const itemFQCN = (tableVO.desc as ListDescription).itemType;

  const item = config.types[itemFQCN];

  if(!item) {
    return false;
  }

  return Object.keys(get(item.schema, 'properties', {})).filter(prop => {
    const propSchema = get(item.schema, `properties.${prop}`, {type: "string"}) as JSONSchema7;

    return !!propSchema.enum || (propSchema.type && propSchema.type === "boolean")
  }).length > 0;
}
