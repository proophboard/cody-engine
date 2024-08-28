import {Node, NodeType} from "@proophboard/cody-types";
import {getSingleSource, isCodyError} from "@proophboard/cody-utils";
import {Context} from "@cody-engine/cody/hooks/context";
import {findAggregateState} from "@cody-engine/cody/hooks/utils/aggregate/find-aggregate-state";
import {findCommandForEvent} from "@cody-engine/cody/hooks/utils/event/find-command-for-event";

export const getOriginalEvent = (event: Node, ctx: Context): Node => {
  let command = findCommandForEvent(event, ctx);

  if(isCodyError(command) && event.getTags().contains('pb:connected')) {
    for (const [, syncedNode] of ctx.syncedNodes) {
      if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
        && syncedNode.getTags().contains('pb:connected')) {
        command = findCommandForEvent(syncedNode, ctx);

        if(!isCodyError(command)) {
          event = syncedNode;
          break;
        }
      }
    }
  }

  return event;
}
