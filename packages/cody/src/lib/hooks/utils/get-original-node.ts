import {Node} from "@proophboard/cody-types";
import {Context} from "../context";
import {mergeWithSimilarNodes} from "@proophboard/cody-utils";

export const getOriginalNode = (node: Node, ctx: Context): Node => {
  // @TODO: when connected nodes are available on prooph board, this function should follow the connection and return the original node
  // instead of merging similar nodes. The latter is just a workaround as long as the feature is not available
  return mergeWithSimilarNodes(node, ctx.syncedNodes);
}
