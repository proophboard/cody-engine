import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  CodyResponseException,
  playIsCodyError,
  playwithErrorCheck
} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {playCommandMetadata} from "@cody-play/infrastructure/cody/command/play-command-metadata";
import {names} from "@event-engine/messaging/helpers";
import {
  playFindAggregateState,
  playGetSingleTarget,
  playGetTargetsOfType
} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {playEnsureAllRefsAreKnown} from "@cody-play/infrastructure/cody/schema/play-ensure-all-refs-are-known";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";
import {isStateDescription} from "@event-engine/descriptions/descriptions";
import {playVoFQCN} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {alwaysRecordEvent} from "@cody-engine/cody/hooks/utils/aggregate/always-record-event";
import {normalizeThenRecordEventRules} from "@cody-play/infrastructure/rule-engine/normalize-then-record-event-rules";

export const onCommand = async (command: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {
    const meta = playwithErrorCheck(playCommandMetadata, [command, ctx]);

    const cmdNames = names(command.getName());
    const aggregate = playGetSingleTarget(command, NodeType.aggregate);
    const isAggregateConnected = !playIsCodyError(aggregate);

    const service = playwithErrorCheck(playService, [command, ctx]);
    const serviceNames = names(service);
    const uiSchema = meta.uiSchema || {};

    const aggregateState = playFindAggregateState(command, ctx, config.types);

    const cmdFQCN = `${serviceNames.className}.${cmdNames.className}`;
    const pbInfo = playUpdateProophBoardInfo(command, ctx, config.commands[cmdFQCN]?.desc);
    const dependencies = meta.dependencies;
    const deleteState = !!meta.deleteState;
    const deleteHistory = !!meta.deleteHistory;

    if(playIsCodyError(aggregateState)) {
      dispatch({
        type: "ADD_COMMAND",
        name: cmdFQCN,
        command: {
          desc: {
            ...pbInfo,
            dependencies,
            name: cmdFQCN,
            aggregateCommand: false,
            deleteState,
            deleteHistory
          },
          schema: meta.schema,
          uiSchema,
          factory: []
        }
      });


      return {
        cody: `Alright, command "${command.getName()}" is available now.`,
      }
    }

    const aggregateStateNames = names(aggregateState.getName());
    const aggregateStateMeta = playwithErrorCheck(playVoMetadata, [aggregateState, ctx, config.types]);

    if(!isStateDescription(aggregateStateMeta)) {
      return {
        cody: `State Information "${aggregateState.getName()}" has no identifier defined.`,
        type: CodyResponseType.Error,
        details: `Information changed by a Command needs an identifier, so that the Information can be loaded from the database. Please set an Identifier in the Metadata of the corresponding Information card.`,
      }
    }

    playwithErrorCheck(playEnsureAllRefsAreKnown, [command, meta.schema, config.types]);


    const aggregateFQCN = `${serviceNames.className}.${names(aggregateState.getName()).className}`;
    const stateFQCN = playwithErrorCheck(playVoFQCN, [aggregateState, aggregateStateMeta, ctx]);

    dispatch({
      type: "ADD_COMMAND",
      name: cmdFQCN,
      command: {
        desc: {
          ...pbInfo,
          dependencies,
          name: cmdFQCN,
          aggregateCommand: true,
          newAggregate: meta.newAggregate,
          aggregateName: aggregateFQCN,
          aggregateIdentifier: aggregateStateMeta.identifier,
          deleteState,
          deleteHistory
        },
        schema: meta.schema,
        uiSchema,
        factory: []
      }
    });

    if(!isAggregateConnected) {
      const events = playwithErrorCheck(playGetTargetsOfType, [command, NodeType.event]);

      const rules = events.map(evt => alwaysRecordEvent(evt));

      dispatch({
        type: "ADD_AGGREGATE",
        name: aggregateFQCN,
        command: cmdFQCN,
        aggregate: {
          ...pbInfo,
          name: aggregateFQCN,
          identifier: aggregateStateMeta.identifier,
          collection: aggregateStateMeta.collection || aggregateStateNames.constantName.toLowerCase() + '_collection',
          stream: 'write_model_stream',
          state: stateFQCN
        },
        businessRules: normalizeThenRecordEventRules(aggregateFQCN, rules.toArray()),
      })
    }

    return {
      cody: `Alright, command "${command.getName()}" is available now.`,
    }

  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
