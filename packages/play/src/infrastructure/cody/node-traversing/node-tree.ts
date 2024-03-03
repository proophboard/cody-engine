import {
  CodyResponse,
  CodyResponseType,
  GraphPoint,
  GraphPointRecord,
  Node,
  NodeMap,
  NodeType
} from "@proophboard/cody-types";
import {List} from "immutable";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {isStateDescription} from "@event-engine/descriptions/descriptions";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {PlayInformationRegistry} from "@cody-play/state/types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

type Success = Node;
type Error = CodyResponse;

export const playFindParentByType = (node: Node | null, type: NodeType): Node | null => {
  if(node && node.getType() === type) {
    return node;
  }

  if(!node) {
    return null;
  }

  return playFindParentByType(node.getParent(), type);
}

export const playGetSingleSource = (node: Node, expectedType: NodeType): Success | Error => {
  const sources = node.getSources().filter(t => t.getType() === expectedType);

  if(sources.count() === 0) {
    return {
      cody: `Looking for a "${expectedType}" as a source of "${node.getName()}", but there is non connected.`,
      details: `I'd love to, but I cannot proceed without a ${expectedType}`,
      type: CodyResponseType.Error
    };
  }

  if(sources.count() > 1) {
    return {
      cody: `Looking for a single "${expectedType}" as a source of "${node.getName()}", but there are multiple connected.`,
      details: `You could teach me to handle the situation. But at the moment I can't, sorry.`,
      type: CodyResponseType.Error
    };
  }

  return sources.first();
}

export const playGetSingleTarget = (node: Node, expectedType: NodeType): Success | Error => {
  const targets = node.getTargets().filter(t => t.getType() === expectedType);

  if(targets.count() === 0) {
    return {
      cody: `Looking for a "${expectedType}" as a target of "${node.getName()}", but there is non connected.`,
      details: `Check your design. Cannot proceed without a ${expectedType}`,
      type: CodyResponseType.Error
    };
  }

  if(targets.count() > 1) {
    return {
      cody: `Looking for a single "${expectedType}" as a target of "${node.getName()}", but there are multiple connected.`,
      details: `Not sure what you've planned? But I cannot handle it this way, sorry.`,
      type: CodyResponseType.Error
    };
  }

  return node.getTargets().first();
}

export const playGetNodesOfTypeNearby = (node: Node, type: NodeType, nearbyPadding: number, syncedNodes: NodeMap): List<Node> => {
  const point = playGetAbsoluteGraphPoint(node);
  const mostLeft = point.x - nearbyPadding;
  const mostRight = point.x + nearbyPadding;
  const mostTop = point.y + nearbyPadding;
  const mostBottom = point.y - nearbyPadding;

  return syncedNodes.filter(n => n.getType() === type).filter(n => {
    const nPoint = playGetAbsoluteGraphPoint(n);

    return nPoint.x > mostLeft && nPoint.x < mostRight && nPoint.y < mostTop && nPoint.y > mostBottom;
  }).toList();
}

export const playGetNodeFromSyncedNodes = (node: Node, syncedNodes: NodeMap): Success | Error => {
  const filteredNodes = syncedNodes.filter(otherNode => otherNode.getId() === node.getId());

  if(filteredNodes.count() === 1) {
    return filteredNodes.first();
  }

  return {
    cody: `Tried to find node ${node.getName()} of type ${node.getType()} in list of synced nodes. But it is not there.`,
    details: `Try to refresh prooph board and reconnect to Cody again!`,
    type: CodyResponseType.Error
  }
}

export const playGetSourcesOfType = (node: Node, expectedType: NodeType, ignoreOthers = false, includeChildren = false, allowEmpty = false): List<Success> | Error => {
  let sources = node.getSources().filter(t => t.getType() === expectedType);

  if(sources.count() !== node.getSources().count() && !ignoreOthers) {
    return {
      cody: `Only "${expectedType}" is a valid source for "${node.getName()}", but there seem to be other card types connected.`,
      details: `You might have a second look at it?`,
      type: CodyResponseType.Error
    };
  }

  if(includeChildren) {
    node.getChildren().forEach(child => {
      sources = sources.push(...child.getSources().filter(t => t.getType() === expectedType));
    })
  }

  if(sources.count() === 0 && !allowEmpty) {
    return {
      cody: `Looking for a "${expectedType}" as a source of "${node.getName()}", but there is non connected.`,
      details: `I'd love to, but I cannot proceed without a ${expectedType}`,
      type: CodyResponseType.Error
    };
  }

  return sources;
}

export const playGetTargetsOfType = (node: Node, expectedType: NodeType, ignoreOthers = false, includeChildren = false, allowEmpty = false): List<Success> | Error => {
  let targets = node.getTargets().filter(t => t.getType() === expectedType);

  if(targets.count() !== node.getTargets().count() && !ignoreOthers) {
    return {
      cody: `Only "${expectedType}" is a valid target for "${node.getName()}", but there seem to be other card types connected.`,
      details: `You might have a second look at it?`,
      type: CodyResponseType.Error
    };
  }

  if(includeChildren) {
    node.getChildren().forEach(child => {
      targets = targets.push(...child.getTargets().filter(t => t.getType() === expectedType));
    })
  }

  if(targets.count() === 0 && !allowEmpty) {
    return {
      cody: `Looking for a "${expectedType}" as a target of "${node.getName()}", but there is non connected.`,
      details: `I'd love to, but I cannot proceed without a ${expectedType}`,
      type: CodyResponseType.Error
    };
  }

  return targets;
}

export const playFindAggregateState = (commandEventOrAggregate: Node, ctx: ElementEditedContext, types: PlayInformationRegistry): Success | Error => {
  let events = List<Node>();

  if(commandEventOrAggregate.getType() === NodeType.aggregate) {
    const eventsOrError = playGetTargetsOfType(commandEventOrAggregate, NodeType.event);

    if(playIsCodyError(eventsOrError)) {
      return eventsOrError;
    }

    events = eventsOrError;
  } else if (commandEventOrAggregate.getType() === NodeType.command) {
    const cmdAggregate = playGetSingleTarget(commandEventOrAggregate, NodeType.aggregate);

    if(playIsCodyError(cmdAggregate)) {
      const cmdEventsOrError = playGetTargetsOfType(commandEventOrAggregate, NodeType.event);

      if(playIsCodyError(cmdEventsOrError)) {
        return cmdEventsOrError;
      }

      events = cmdEventsOrError;
    } else {
      const syncedAggregate = playGetNodeFromSyncedNodes(cmdAggregate, ctx.syncedNodes);

      if(playIsCodyError(syncedAggregate)) {
        return syncedAggregate;
      }

      return playFindAggregateState(syncedAggregate, ctx, types);
    }
  } else if (commandEventOrAggregate.getType() === NodeType.event) {
    events = events.push(commandEventOrAggregate);
  }

  for (const event of events) {
    const syncedEvent = playGetNodeFromSyncedNodes(event, ctx.syncedNodes);

    if(playIsCodyError(syncedEvent)) {
      return syncedEvent;
    }

    const vos = playGetTargetsOfType(syncedEvent, NodeType.document, true, false, true);

    if(playIsCodyError(vos)) {
      return vos;
    }

    for (const vo of vos) {
      const voMeta = playVoMetadata(vo, ctx, types);

      if(playIsCodyError(voMeta)) {
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

export const playGetAbsoluteGraphPoint = (node: Node, calculatedChildGraphPoint?: GraphPoint): GraphPoint => {
  if(!calculatedChildGraphPoint) {
    calculatedChildGraphPoint = node.getGeometry();
  }

  const parent = node.getParent();

  if(!parent) {
    return calculatedChildGraphPoint;
  }

  if(parent.getType() === NodeType.layer) {
    return calculatedChildGraphPoint;
  }

  return playGetAbsoluteGraphPoint(parent, new GraphPointRecord({
    x: parent.getGeometry().x + calculatedChildGraphPoint.x,
    y: parent.getGeometry().y + calculatedChildGraphPoint.y
  }))
}


