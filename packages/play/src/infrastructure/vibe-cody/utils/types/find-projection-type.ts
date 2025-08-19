import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  isQueryableListDescription,
  isQueryableStateListDescription,
  ListDescription
} from "@event-engine/descriptions/descriptions";
import {isTableDescription} from "@cody-play/infrastructure/vibe-cody/utils/types/is-table-description";
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {JSONSchema7} from "json-schema";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";

export const findProjectionType = (stateVO: PlayInformationRuntimeInfo, config: CodyPlayConfig): PlayInformationRuntimeInfo | undefined => {


  const types = Object.values(config.types);

  for (const t of types) {
    if(isQueryableStateListDescription(t.desc)) {
      if(t.desc.itemType === stateVO.desc.name) {
        return t;
      }
    }
  }
}

export const findProjectionTypeOfList = (listVO: PlayInformationRuntimeInfo, config: CodyPlayConfig): PlayInformationRuntimeInfo | undefined => {
  if(listVO.desc.projection) {
    return listVO;
  }

  if(!isTableDescription(listVO.desc)) {
    return;
  }

  const tableVoSchema = new Schema(cloneDeepJSON(listVO.schema) as JSONSchema7, true);

  let itemFQCN = '';
  let itemSchema = new Schema({}, true);

  if(tableVoSchema.getListItemsSchema(itemSchema).isRef()) {
    itemFQCN = playFQCNFromDefinitionId(tableVoSchema.getListItemsSchema(itemSchema).getRef());
  } else {
    itemFQCN = (listVO.desc as ListDescription).itemType;
  }

  const itemInfo = config.types[itemFQCN];

  if(!itemInfo) {
    return;
  }

  return findProjectionType(itemInfo, config);
}
