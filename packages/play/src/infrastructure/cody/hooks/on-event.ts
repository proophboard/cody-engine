import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  CodyResponseException,
  playIsCodyError,
  playwithErrorCheck
} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {playFindAggregateState, playGetSingleSource,} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playEventMetadata} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {playEnsureAllRefsAreKnown} from "@cody-play/infrastructure/cody/schema/play-ensure-all-refs-are-known";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {
  AggregateEventDescription, EventDescription,
  isStateDescription
} from "@event-engine/descriptions/descriptions";
import {playVoFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {playCommandMetadata} from "@cody-play/infrastructure/cody/command/play-command-metadata";

export const onEvent = async (event: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {
    const service = playwithErrorCheck(playService, [event, ctx]);
    const serviceNames = names(service);
    const meta = playwithErrorCheck(playEventMetadata, [event, ctx, config.types]);
    const orgEvent = getOriginalEvent(event, ctx);

    const pbInfo = playwithErrorCheck(playUpdateProophBoardInfo, [orgEvent, ctx, config.events[meta.fqcn]?.desc]);
    playwithErrorCheck(playEnsureAllRefsAreKnown, [orgEvent, meta.schema, config.types]);

    const aggregate = playGetSingleSource(orgEvent, NodeType.aggregate);
    const command = playGetSingleSource(playIsCodyError(aggregate) ? orgEvent : aggregate, NodeType.command);
    const commandMeta = playIsCodyError(command)? command : playCommandMetadata(command, ctx);

    const isAggregateEvent = !playIsCodyError(commandMeta) && commandMeta.aggregateCommand;

    if(!isAggregateEvent) {
      dispatch({
        type: "ADD_PURE_EVENT",
        name: meta.fqcn,
        event: {
          desc: ({
            ...pbInfo,
            name: meta.fqcn,
            aggregateEvent: isAggregateEvent,
          } as EventDescription),
          schema: meta.schema,
          factory: []
        },
      });

      return {
        cody: `Done! The app has a new event called "${meta.fqcn}".`,
      }
    }


    let aggregateState = playFindAggregateState(event, ctx,  config.types);

    if(playIsCodyError(aggregateState) && event.getTags().contains('pb:connected')) {
      for (const [, syncedNode] of ctx.syncedNodes) {
        if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
          && syncedNode.getTags().contains('pb:connected')) {
          aggregateState = playFindAggregateState(syncedNode, ctx, config.types);

          if(!playIsCodyError(aggregateState)) {
            event = syncedNode;
            break;
          }
        }
      }
    }

    if(playIsCodyError(aggregateState)) {
      // @TODO: handle non-aggregate event
      return aggregateState;
    }

    const aggregateNames = names(aggregateState.getName());

    const aggregateStateMeta = playwithErrorCheck(playVoMetadata, [aggregateState, ctx, config.types]);


    if(!isStateDescription(aggregateStateMeta)) {
      return {
        cody: `Aggregate Information "${aggregateState.getName()}" has no identifier defined.`,
        type: CodyResponseType.Error,
        details: `Information managed by an Aggregate needs an identifier, so that the Information can be loaded from the database. Please set an Identifier in the Cody Wizard of the corresponding Information card.`,
      }
    }

    dispatch({
      type: "ADD_AGGREGATE_EVENT",
      name: meta.fqcn,
      aggregate: `${serviceNames.className}.${aggregateNames.className}`,
      event: {
        desc: ({
          ...pbInfo,
          name: meta.fqcn,
          aggregateEvent: isAggregateEvent,
          aggregateIdentifier: aggregateStateMeta.identifier,
          aggregateState: playwithErrorCheck(playVoFQCN, [aggregateState, aggregateStateMeta, ctx]),
        } as AggregateEventDescription),
        schema: meta.schema,
        factory: []
      },
      reducer: meta.applyRules || []
    });

    return {
      cody: `Done! The app has a new event called "${meta.fqcn}".`,
    }

  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}

const getOriginalEvent = (event: Node, ctx: ElementEditedContext): Node => {
  const sources = event.getSources();

  for (const source of sources) {
    if(source.getType() === NodeType.command || source.getType() === NodeType.aggregate) {
      return event;
    }
  }

  if(!event.getTags().contains('pb:connected')) {
    return event;
  }

  for (const [, syncedNode] of ctx.syncedNodes) {
    if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
      && syncedNode.getTags().contains('pb:connected')) {
      const sourcesOfSyncedNode = syncedNode.getSources();

      for (const source of sourcesOfSyncedNode) {
        if(source.getType() === NodeType.command || source.getType() === NodeType.aggregate) {
          return syncedNode;
        }
      }
    }
  }

  return event;
}
