import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {List} from "immutable";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {playGetNodesOfTypeNearby, playGetSourcesOfType} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

export const playAllowedRoles = (ui: Node, ctx: ElementEditedContext): List<Node> | CodyResponse => {
  const connectedRoles = playGetSourcesOfType(ui, NodeType.role, true, false, true);

  if(playIsCodyError(connectedRoles)) {
    return connectedRoles;
  }

  const connectedRolesNames = connectedRoles.map(r => r.getName());

  const rolesNearby = playGetNodesOfTypeNearby(ui, NodeType.role, 200, ctx.syncedNodes)
    .filter(r => !connectedRolesNames.contains(r.getName()));

  return connectedRoles.merge(rolesNearby);
}
