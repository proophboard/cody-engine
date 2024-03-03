import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {getSingleTarget, getTargetsOfType, isCodyError} from "@proophboard/cody-utils";
import {getNodeFromSyncedNodes} from "../node-tree";
import {getVoMetadata} from "../value-object/get-vo-metadata";
import {isStateDescription} from "@event-engine/descriptions/descriptions";
import {List} from "immutable";

type Success = Node;
type Error = CodyResponse;

export const findAggregateState = (commandEventOrAggregate: Node, ctx: Context): Success | Error => {
  let events = List<Node>();

  if(commandEventOrAggregate.getType() === NodeType.aggregate) {
    const eventsOrError = getTargetsOfType(commandEventOrAggregate, NodeType.event);

    if(isCodyError(eventsOrError)) {
      return eventsOrError;
    }

    events = eventsOrError;
  } else if (commandEventOrAggregate.getType() === NodeType.command) {
    const cmdAggregate = getSingleTarget(commandEventOrAggregate, NodeType.aggregate);

    if(isCodyError(cmdAggregate)) {
      const cmdEventsOrError = getTargetsOfType(commandEventOrAggregate, NodeType.event);

      if(isCodyError(cmdEventsOrError)) {
        return cmdEventsOrError;
      }

      events = cmdEventsOrError;
    } else {
      const syncedAggregate = getNodeFromSyncedNodes(cmdAggregate, ctx.syncedNodes);

      if(isCodyError(syncedAggregate)) {
        return syncedAggregate;
      }

      return findAggregateState(syncedAggregate, ctx);
    }
  } else if (commandEventOrAggregate.getType() === NodeType.event) {
    events = events.push(commandEventOrAggregate);
  }

  for (const event of events) {
    const syncedEvent = getNodeFromSyncedNodes(event, ctx.syncedNodes);

    if(isCodyError(syncedEvent)) {
      return syncedEvent;
    }

    const vos = getTargetsOfType(syncedEvent, NodeType.document, true, false, true);

    if(isCodyError(vos)) {
      return vos;
    }

    for (const vo of vos) {
      const voMeta = getVoMetadata(vo, ctx);

      if(isCodyError(voMeta)) {
        return voMeta;
      }

      if(isStateDescription(voMeta)) {
        return vo;
      }
    }
  }

  return {
    cody: `I cannot find an information card that defines the state for: ${commandEventOrAggregate.getName()}.`,
    type: CodyResponseType.Error,
    details: `State information needs to be of type object and should have an identifier. It should also be the result of an event.`,
  }
}
