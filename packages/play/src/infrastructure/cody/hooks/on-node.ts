import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {onUi} from "@cody-play/infrastructure/cody/hooks/on-ui";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {onCommand} from "@cody-play/infrastructure/cody/hooks/on-command";
import {onDocument} from "@cody-play/infrastructure/cody/hooks/on-document";
import {onAggregate} from "@cody-play/infrastructure/cody/hooks/on-aggregate";
import {onEvent} from "@cody-play/infrastructure/cody/hooks/on-event";
import {onPolicy} from "@cody-play/infrastructure/cody/hooks/on-policy";
import {onRole} from "@cody-play/infrastructure/cody/hooks/on-role";

export const onNode = async (node: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  switch (node.getType()) {
    case NodeType.ui:
      return onUi(node, dispatch, ctx, config);
    case NodeType.command:
      return onCommand(node, dispatch, ctx, config);
    case NodeType.aggregate:
      return onAggregate(node, dispatch, ctx, config);
    case NodeType.event:
      return onEvent(node, dispatch, ctx, config);
    case NodeType.document:
      return onDocument(node, dispatch, ctx, config);
    case NodeType.policy:
      return onPolicy(node, dispatch, ctx, config);
    case NodeType.role:
      return onRole(node, dispatch, ctx, config);
  }

  return {
    cody: `Skipping ${node.getName()}. No hook defined for type ${node.getType()}`,
  }
}
