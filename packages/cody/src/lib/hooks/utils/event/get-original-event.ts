import {Node, NodeType} from "@proophboard/cody-types";
import {getSingleSource, isCodyError} from "@proophboard/cody-utils";
import {Context} from "@cody-engine/cody/hooks/context";
import {findAggregateState} from "@cody-engine/cody/hooks/utils/aggregate/find-aggregate-state";

export const getOriginalEvent = (event: Node, ctx: Context): Node => {
  let aggregateState = findAggregateState(event, ctx);

  if(isCodyError(aggregateState) && event.getTags().contains('pb:connected')) {
    for (const [, syncedNode] of ctx.syncedNodes) {
      if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
        && syncedNode.getTags().contains('pb:connected')) {
        aggregateState = findAggregateState(syncedNode, ctx);

        if(!isCodyError(aggregateState)) {
          event = syncedNode;
          break;
        }
      }
    }
  }

  return event;
}
