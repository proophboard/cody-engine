import {CodyPlayConfig} from "@cody-play/state/config-store";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {getAllTypesOnPage} from "@cody-play/infrastructure/vibe-cody/utils/types/get-all-types-on-page";
import {isQueryableStateDescription, isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {findProjectionType} from "@cody-play/infrastructure/vibe-cody/utils/types/find-projection-type";
import {getParentRouteOfParam} from "@cody-play/infrastructure/vibe-cody/utils/navigate/get-parent-route-of-param";

export const findDataSelectTypeForRouteParam = (param: string, route: string, config: CodyPlayConfig): PlayInformationRuntimeInfo | undefined => {
  const parentRoute = getParentRouteOfParam(param, route);

  const parentPage = Object.values(config.pages).find(p => p.route === parentRoute);

  if(!parentPage) {
    return;
  }

  const typesOnPage = getAllTypesOnPage(parentPage, config);

  for (const type of typesOnPage) {
    const {desc} = type;

    if(isQueryableStateDescription(desc) && desc.identifier === param) {
      return findProjectionType(type, config);
    }

    if(isQueryableStateListDescription(desc) && desc.itemIdentifier === param) {
      return type;
    }
  }
}
