import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {onUi} from "@cody-play/infrastructure/cody/hooks/on-ui";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {onCommand} from "@cody-play/infrastructure/cody/hooks/on-command";
import {onDocument} from "@cody-play/infrastructure/cody/hooks/on-document";
import {onAggregate} from "@cody-play/infrastructure/cody/hooks/on-aggregate";

export const onNode = async (node: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  switch (node.getType()) {
    case NodeType.ui:
      return onUi(node, dispatch, ctx, config);
    case NodeType.command:
      return onCommand(node, dispatch, ctx, config);
    case NodeType.aggregate:
      return onAggregate(node, dispatch, ctx, config);
    case NodeType.document:
      return onDocument(node, dispatch, ctx, config);
  }

  return {
    cody: `Ignored ${node.getName()}. No hook defined for type ${node.getType()}`,
    type: CodyResponseType.Warning
  }
}
