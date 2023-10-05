import {Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {
  playGetNodeFromSyncedNodes,
  playGetSingleSource
} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playIsCodyError, playwithErrorCheck} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

export const playOriginalEvent = (event: Node, ctx: ElementEditedContext): Node => {
  let aggregate = playGetSingleSource(event, NodeType.aggregate);

  if(playIsCodyError(aggregate) && event.getTags().contains('pb:connected')) {
    for (const [, syncedNode] of ctx.syncedNodes) {
      if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
        && syncedNode.getTags().contains('pb:connected')) {
        aggregate = playGetSingleSource(syncedNode, NodeType.aggregate);

        if(!playIsCodyError(aggregate)) {
          event = syncedNode;
          break;
        }
      }
    }
  }

  return event;
}
