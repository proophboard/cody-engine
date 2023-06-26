import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {UiMetadata} from "./get-ui-metadata";
import {Context} from "../../context";
import {getSourcesOfType, isCodyError} from "@proophboard/cody-utils";
import {getNodeFromSyncedNodes} from "../node-tree";
import {getVoMetadata} from "../value-object/get-vo-metadata";
import {isQueryableStateDescription} from "@event-engine/descriptions/descriptions";

export const isTopLevelPage = (ui: Node, uiMeta: UiMetadata, ctx: Context): boolean | CodyResponse => {
  if(uiMeta.sidebar) {
    return true;
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

    if(isQueryableStateDescription(vMMeta)) {
      isTopLevelPage = false;
    }
  })

  return isTopLevelPage;
}
