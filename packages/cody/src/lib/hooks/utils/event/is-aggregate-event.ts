import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "@cody-engine/cody/hooks/context";
import {getSingleSource, getTargetsOfType, isCodyError} from "@proophboard/cody-utils";
import {getOriginalEvent} from "@cody-engine/cody/hooks/utils/event/get-original-event";
import {getCommandMetadata} from "@cody-engine/cody/hooks/utils/command/command-metadata";

type Success = boolean;
type Error = CodyResponse;

export const isAggregateEvent = (event: Node, ctx: Context): Success | Error => {
  event = getOriginalEvent(event, ctx);

  const aggregate = getSingleSource(event, NodeType.aggregate);

  if(!isCodyError(aggregate)) {
    return true;
  }

  const command = getSingleSource(event, NodeType.command);

  if(isCodyError(command)) {
    return false;
  }

  const commandMeta = getCommandMetadata(command, ctx);

  if(isCodyError(commandMeta)) {
    return commandMeta;
  }

  return commandMeta.aggregateCommand;
}
