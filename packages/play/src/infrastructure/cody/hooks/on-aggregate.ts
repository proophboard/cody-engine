import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  CodyResponseException,
  playwithErrorCheck
} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {
  playFindAggregateState,
  playGetSingleSource,
  playGetTargetsOfType
} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {AggregateMetadata} from "@cody-engine/cody/hooks/utils/aggregate/metadata";
import {alwaysRecordEvent} from "@cody-engine/cody/hooks/utils/aggregate/always-record-event";
import {isStateDescription} from "@event-engine/descriptions/descriptions";
import {playVoFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {normalizeThenRecordEventRules} from "@cody-play/infrastructure/rule-engine/normalize-then-record-event-rules";

export const onAggregate = async (aggregate: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {

    const service = playwithErrorCheck(playService, [aggregate, ctx]);
    const serviceNames = names(service);
    const command = playwithErrorCheck(playGetSingleSource, [aggregate, NodeType.command]);
    const commandNames = names(command.getName());
    const events = playwithErrorCheck(playGetTargetsOfType, [aggregate, NodeType.event, true]);
    const aggregateState = playwithErrorCheck(playFindAggregateState, [aggregate, ctx, config.types]);
    const aggregateStateNames = names(aggregateState.getName());
    const aggregateStateMeta = playwithErrorCheck(playVoMetadata, [aggregateState, ctx, config.types]);
    const meta = aggregate.getMetadata()? playwithErrorCheck(playParseJsonMetadata, [aggregate]) as AggregateMetadata : {};
    const aggregateNames = names(aggregateState.getName());

    if(!isStateDescription(aggregateStateMeta)) {
      return {
        cody: `Aggregate Information "${aggregateState.getName()}" has no identifier defined.`,
        type: CodyResponseType.Error,
        details: `Information managed by an Aggregate needs an identifier, so that the Information can be loaded from the database. Please set an Identifier in the Cody Wizard of the corresponding Information card.`,
      }
    }

    const collection = aggregateStateMeta.collection || aggregateStateNames.constantName.toLowerCase() + '_collection';
    const stream = meta.stream || 'write_model_stream';
    let rules = meta.rules || [];

    if(rules.length === 0) {
      events.forEach(evt => rules.push(alwaysRecordEvent(evt)))
    }



    const aggregateName = `${serviceNames.className}.${aggregateNames.className}`;
    const commandName = `${serviceNames.className}.${commandNames.className}`;
    const stateFQCN = playwithErrorCheck(playVoFQCN, [aggregateState, aggregateStateMeta, ctx]);
    const pbInfo = playwithErrorCheck(playUpdateProophBoardInfo, [aggregate, ctx, config.aggregates[aggregateName]])
    rules = normalizeThenRecordEventRules(aggregateName, rules);

    dispatch({
      type: "ADD_AGGREGATE",
      name: aggregateName,
      command: commandName,
      aggregate: {
        ...pbInfo,
        name: aggregateName,
        identifier: aggregateStateMeta.identifier,
        collection,
        stream,
        state: stateFQCN
      },
      businessRules: rules,
    })

    return {
      cody: `Done! A new command handling function of aggregate "${aggregate.getName()}" is added to the system.`,
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
