import {
  CodyResponse,
  CodyResponseType,
  Node,
  NodeMap,
  NodeType
} from "@proophboard/cody-types";
import {List} from "immutable";
import {getAbsoluteGraphPoint} from "@proophboard/cody-utils";

type Success = Node;
type Error = CodyResponse;

export const findParentByType = (node: Node | null, type: NodeType): Node | null => {
  if(node && node.getType() === type) {
    return node;
  }

  if(!node) {
    return null;
  }

  return findParentByType(node.getParent(), type);
}

export const getNodesOfTypeNearby = (node: Node, type: NodeType, nearbyPadding: number, syncedNodes: NodeMap): List<Node> => {
  const point = getAbsoluteGraphPoint(node);
  const mostLeft = point.x - nearbyPadding;
  const mostRight = point.x + nearbyPadding;
  const mostTop = point.y + nearbyPadding;
  const mostBottom = point.y - nearbyPadding;

  return syncedNodes.filter(n => n.getType() === type).filter(n => {
    const nPoint = getAbsoluteGraphPoint(n);

    return nPoint.x > mostLeft && nPoint.x < mostRight && nPoint.y < mostTop && nPoint.y > mostBottom;
  }).toList();
}

export const getNodeFromSyncedNodes = (node: Node, syncedNodes: NodeMap): Success | Error => {
  const filteredNodes = syncedNodes.filter(otherNode => otherNode.getId() === node.getId());

  if(filteredNodes.count() === 1) {
    return filteredNodes.first();
  }

  return {
    cody: `Tried to find node ${node.getName()} of type ${node.getType()} in list of synced nodes. But it is not there.`,
    details: `Try to refresh prooph board and reconnect to Cody again!`,
    type: CodyResponseType.Error
  }
}


