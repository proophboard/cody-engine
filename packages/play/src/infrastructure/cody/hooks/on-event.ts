import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  CodyResponseException, playIsCodyError,
  playwithErrorCheck
} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {
  playFindAggregateState,
  playGetNodeFromSyncedNodes,
  playGetSingleSource
} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playEventMetadata} from "@cody-play/infrastructure/cody/event/play-event-metadata";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {playEnsureAllRefsAreKnown} from "@cody-play/infrastructure/cody/schema/play-ensure-all-refs-are-known";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {AggregateEventDescription, isStateDescription} from "@event-engine/descriptions/descriptions";
import {playVoFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";

export const onEvent = async (event: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {
    const eventNames = names(event.getName());
    let aggregate = playGetSingleSource(event, NodeType.aggregate);

    if(playIsCodyError(aggregate) && event.getTags().contains('pb:connected')) {
      for (const [, syncedNode] of ctx.syncedNodes) {
        if(syncedNode.getType() === NodeType.event && syncedNode.getName() === event.getName()
          && syncedNode.getTags().contains('pb:connected')) {
          aggregate = playGetSingleSource(syncedNode, NodeType.aggregate);

          if(!playIsCodyError(aggregate)) {
            event = syncedNode;
            break;
          }
        }
      }
    }

    const service = playwithErrorCheck(playService, [event, ctx]);
    const serviceNames = names(service);
    const meta = playwithErrorCheck(playEventMetadata, [event, ctx, config.types]);

    const isAggregateEvent = !playIsCodyError(aggregate);

    if(playIsCodyError(aggregate)) {
      // @TODO: handle non-aggregate event
      return aggregate;
    }

    const aggregateNames = names(aggregate.getName());

    const syncedAggregate = playwithErrorCheck(playGetNodeFromSyncedNodes, [aggregate, ctx.syncedNodes]);
    const aggregateState = playwithErrorCheck(playFindAggregateState, [syncedAggregate, ctx, config.types]);
    const aggregateStateNames = names(aggregateState.getName());
    const aggregateStateMeta = playwithErrorCheck(playVoMetadata, [aggregateState, ctx, config.types]);
    const pbInfo = playwithErrorCheck(playUpdateProophBoardInfo, [event, ctx, config.events[meta.fqcn]?.desc]);

    playwithErrorCheck(playEnsureAllRefsAreKnown, [event, meta.schema, config.types]);

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
          name: meta.fqcn,
          aggregateEvent: isAggregateEvent,
          aggregateIdentifier: aggregateStateMeta.identifier,
          aggregateState: playwithErrorCheck(playVoFQCN, [aggregateState, aggregateStateMeta, ctx]),
          ...pbInfo
        } as AggregateEventDescription),
        schema: meta.schema,
        factory: []
      },
      reducer: meta.applyRules || []
    });

    return {
      cody: `Done! The app has a new event called "${event.getName()}".`,
    }

  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
