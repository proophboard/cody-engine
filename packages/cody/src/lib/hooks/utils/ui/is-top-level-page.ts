import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {getSourcesOfType, isCodyError} from "@proophboard/cody-utils";
import {getNodeFromSyncedNodes} from "../node-tree";
import {getVoMetadata} from "../value-object/get-vo-metadata";
import {
  isQueryableNotStoredStateDescription,
  isQueryableStateDescription
} from "@event-engine/descriptions/descriptions";
import {UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";

export const isTopLevelPage = (ui: Node, uiMeta: UiMetadata, ctx: Context): boolean | CodyResponse => {
  if(uiMeta.sidebar) {
    return true;
  }

  if(uiMeta.routeParams) {
    return false
  }

  const viewModels = getSourcesOfType(ui, NodeType.document, true, true, true);

  if(isCodyError(viewModels)) {
    return viewModels;
  }

  let isTopLevelPage = true;

  viewModels.forEach(vM => {
    const syncedVm = getNodeFromSyncedNodes(vM, ctx.syncedNodes);

    if(isCodyError(syncedVm)) {
      return false;
    }

    const vMMeta = getVoMetadata(syncedVm, ctx);

    if(isCodyError(vMMeta)) {
      return false;
    }

    if(isQueryableStateDescription(vMMeta) || isQueryableNotStoredStateDescription(vMMeta)) {
      isTopLevelPage = false;
    }
  })

  return isTopLevelPage;
}
