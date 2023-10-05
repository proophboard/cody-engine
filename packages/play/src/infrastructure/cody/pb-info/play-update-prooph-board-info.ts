import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {ProophBoardDescription} from "@event-engine/descriptions/descriptions";
import {now} from "@cody-engine/cody/hooks/utils/time";

export const playUpdateProophBoardInfo = (node: Node, ctx: ElementEditedContext, currentPbInfo: ProophBoardDescription | undefined): ProophBoardDescription => {
  if(currentPbInfo) {
    currentPbInfo._pbBoardId = ctx.boardId;
    currentPbInfo._pbCardId = node.getId();
    currentPbInfo._pbVersion += 1;
    currentPbInfo._pbLink = node.getLink();
    currentPbInfo._pbLastUpdatedBy = ctx.userId;
    currentPbInfo._pbLastUpdatedAt = now();

    return currentPbInfo;
  }

  return {
    _pbBoardId: ctx.boardId,
    _pbCardId: node.getId(),
    _pbLink: node.getLink(),
    _pbVersion: 1,
    _pbCreatedAt: now(),
    _pbCreatedBy: ctx.userId,
    _pbLastUpdatedAt: now(),
    _pbLastUpdatedBy: ctx.userId,
  }
}
