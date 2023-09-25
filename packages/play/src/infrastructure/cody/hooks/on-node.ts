import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {onUi} from "@cody-play/infrastructure/cody/hooks/on-ui";
import {CodyPlayConfig} from "@cody-play/state/config-store";

export const onNode = async (node: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  switch (node.getType()) {
    case NodeType.ui:
      return onUi(node, dispatch, ctx, config);
  }

  return {
    cody: `Ignored ${node.getName()}. No hook defined for type ${node.getType()}`,
    type: CodyResponseType.Warning
  }
}
