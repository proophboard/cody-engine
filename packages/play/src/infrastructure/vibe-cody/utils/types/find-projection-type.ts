import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {isQueryableListDescription, isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";

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
