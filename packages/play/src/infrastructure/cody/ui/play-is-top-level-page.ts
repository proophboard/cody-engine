import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {isQueryableStateDescription} from "@event-engine/descriptions/descriptions";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {
  playGetNodeFromSyncedNodes,
  playGetSourcesOfType
} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {PlayUiMetadata} from "@cody-play/infrastructure/cody/ui/play-ui-metadata";
import {PlayInformationRegistry} from "@cody-play/state/types";

export const playIsTopLevelPage = (ui: Node, uiMeta: PlayUiMetadata, ctx: ElementEditedContext, types: PlayInformationRegistry): boolean | CodyResponse => {
  if(uiMeta.sidebar) {
    return true;
  }

  if(uiMeta.routeParams) {
    return false
  }

  const viewModels = playGetSourcesOfType(ui, NodeType.document, true, true, true);

  if(playIsCodyError(viewModels)) {
    return viewModels;
  }

  let isTopLevelPage = true;

  viewModels.forEach(vM => {
    const syncedVm = playGetNodeFromSyncedNodes(vM, ctx.syncedNodes);

    if(playIsCodyError(syncedVm)) {
      return false;
    }

    const vMMeta = playVoMetadata(syncedVm, ctx, types);

    if(playIsCodyError(vMMeta)) {
      return false;
    }

    if(isQueryableStateDescription(vMMeta)) {
      isTopLevelPage = false;
    }
  })

  return isTopLevelPage;
}
