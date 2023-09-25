import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {names} from "@event-engine/messaging/helpers";
import {getSourcesOfType, isCodyError} from "@proophboard/cody-utils";
import {getNodeFromSyncedNodes} from "../node-tree";
import {getUiMetadata} from "./get-ui-metadata";
import {isTopLevelPage} from "./is-top-level-page";
import {loadPageDefinition} from "./load-page-definition";
import {UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";

export const detectRoute = async (ui: Node, meta: UiMetadata, topLevelPage: boolean, ctx: Context, routeParams: string[] = [], pageDefinition?: PageDefinition): Promise<string | CodyResponse> => {
  if(meta.route) {
    return meta.route;
  }

  if(topLevelPage) {
    return `/${names(ui.getName()).fileName}`;
  }

  const connectedUIs = getSourcesOfType(ui, NodeType.ui, true, true, true);

  if(isCodyError(connectedUIs)) {
    return connectedUIs;
  }

  if(connectedUIs.count() > 1) {
    return {
      cody: `I'm trying to determine the route for UI "${ui.getName()}", but it is connected to more than one source UI.`,
      type: CodyResponseType.Error,
      details: `Please either define a route in the UI metadata or connect only one source UI from where the app user can navigate to UI "${ui.getName()}".`
    }
  }

  if(connectedUIs.count() === 0) {
    if(pageDefinition) {
      return pageDefinition.route;
    }

    return {
      cody: `I'm not able to determine the route for UI "${ui.getName()}".`,
      type: CodyResponseType.Error,
      details: `Please either define a route in the UI metadata or connect one source UI from where the app user can navigate to UI "${ui.getName()}".`
    }
  }

  const connectedUI = connectedUIs.first() as Node;
  const syncedConnectedUI = getNodeFromSyncedNodes(connectedUI, ctx.syncedNodes);

  if(isCodyError(syncedConnectedUI)) {
    return syncedConnectedUI;
  }

  const connectedUIMeta = getUiMetadata(syncedConnectedUI, ctx);

  if(isCodyError(connectedUIMeta)) {
    return connectedUIMeta;
  }

  const isConnectedPageTopLevel = isTopLevelPage(syncedConnectedUI, connectedUIMeta, ctx);

  if(isCodyError(isConnectedPageTopLevel)) {
    return isConnectedPageTopLevel;
  }

  const connectedPageDefinition = await loadPageDefinition(connectedUI, ctx);

  const parentRoute = await detectRoute(
    syncedConnectedUI,
    connectedUIMeta,
    isConnectedPageTopLevel,
    ctx,
    routeParams,
    isCodyError(connectedPageDefinition)? undefined : connectedPageDefinition
  );

  if(isCodyError(parentRoute)) {
    return parentRoute;
  }

  if(routeParams.length) {
    let route = parentRoute;

    routeParams.forEach(p => route += `/:${p}`);

    return route;
  } else {
    return `${parentRoute}/${names(ui.getName()).fileName}`;
  }
}
