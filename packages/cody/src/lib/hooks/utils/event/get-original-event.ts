import {Node, NodeType} from "@proophboard/cody-types";
import {getSingleSource, isCodyError} from "@proophboard/cody-utils";
import {Context} from "@cody-engine/cody/hooks/context";

export const getOriginalEvent = (event: Node, ctx: Context): Node => {
  let aggregate = getSingleSource(event, NodeType.aggregate);

  if(isCodyError(aggregate) && event.getTags().contains('pb:connected')) {
    for (const [, syncedNode] of ctx.syncedNodes) {
      if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
        && syncedNode.getTags().contains('pb:connected')) {
        aggregate = getSingleSource(syncedNode, NodeType.aggregate);

        if(!isCodyError(aggregate)) {
          event = syncedNode;
          break;
        }
      }
    }
  }

  return event;
}
