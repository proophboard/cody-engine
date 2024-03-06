import {Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {
  playFindAggregateState,
  playGetNodeFromSyncedNodes,
  playGetSingleSource
} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playIsCodyError, playwithErrorCheck} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {CodyPlayConfig} from "@cody-play/state/config-store";

export const playOriginalEvent = (event: Node, ctx: ElementEditedContext, config: CodyPlayConfig): Node => {
  let aggregateState = playFindAggregateState(event, ctx, config.types);

  if(playIsCodyError(aggregateState) && event.getTags().contains('pb:connected')) {
    for (const [, syncedNode] of ctx.syncedNodes) {
      if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
        && syncedNode.getTags().contains('pb:connected')) {
        aggregateState = playFindAggregateState(syncedNode, ctx, config.types);

        if(!playIsCodyError(aggregateState)) {
          event = syncedNode;
          break;
        }
      }
    }
  }

  return event;
}
