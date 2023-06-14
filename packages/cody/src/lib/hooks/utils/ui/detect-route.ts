import {CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {UiMeta} from "../../on-ui";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {names} from "@event-engine/messaging/helpers";
import {getSourcesOfType, isCodyError} from "@proophboard/cody-utils";
import {getNodeFromSyncedNodes} from "../node-tree";

export const detectRoute = async (ui: Node, meta: UiMeta, topLevelPage: boolean, ctx: Context, pageDefinition?: PageDefinition): Promise<string | CodyResponse> => {
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
  const connectedUIMeta = // @todo: implement func to get UI meta, implement func to decide if top level page

  const parentRoute = detectRoute(syncedConnectedUI)

}
