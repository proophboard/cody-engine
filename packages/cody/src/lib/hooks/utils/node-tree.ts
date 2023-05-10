import {CodyResponse, CodyResponseType, Node, NodeMap, NodeType} from "@proophboard/cody-types";

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
