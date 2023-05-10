import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {getTargetsOfType, isCodyError} from "@proophboard/cody-utils";
import {getNodeFromSyncedNodes} from "../node-tree";
import {getVoMetadata} from "../value-object/get-vo-metadata";

type Success = Node;
type Error = CodyResponse;

export const findAggregateState = (aggregate: Node, ctx: Context): Success | Error => {
  const events = getTargetsOfType(aggregate, NodeType.event);

  if(isCodyError(events)) {
    return events;
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

      if(voMeta.aggregateState && voMeta.identifier) {
        return vo;
      }
    }
  }

  return {
    cody: `I cannot find an information card that defines the state for the aggregate: ${aggregate.getName()}.`,
    type: CodyResponseType.Error,
    details: `Aggregate state needs to be an object with an identifier and it should be the result of an event.`,
  }
}
