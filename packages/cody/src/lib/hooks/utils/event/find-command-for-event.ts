import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "@cody-engine/cody/hooks/context";
import {getSingleSource, isCodyError} from "@proophboard/cody-utils";

type Success = Node;
type Error = CodyResponse;
export const findCommandForEvent = (event: Node, ctx: Context): Success | Error => {
  const aggregate = getSingleSource(event, NodeType.aggregate);

  if(!isCodyError(aggregate)) {
    const aggregateCommand = getSingleSource(aggregate, NodeType.command);

    return aggregateCommand;
  }

  return getSingleSource(event, NodeType.command);
}
