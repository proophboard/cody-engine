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
  playGetNodeFromSyncedNodes,
  playGetSingleTarget
} from "@cody-play/infrastructure/cody/node-traversing/node-tree";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {playEnsureAllRefsAreKnown} from "@cody-play/infrastructure/cody/schema/play-ensure-all-refs-are-known";
import {playUpdateProophBoardInfo} from "@cody-play/infrastructure/cody/pb-info/play-update-prooph-board-info";

export const onCommand = async (command: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {
    const meta = playwithErrorCheck(playCommandMetadata, [command, ctx]);

    const cmdNames = names(command.getName());
    const aggregate = playGetSingleTarget(command, NodeType.aggregate);

    if(playIsCodyError(aggregate)) {
      return {
        cody: `Skipping command "${command.getName()}", because it has no aggregate connected.`,
      }
    }

    const service = playwithErrorCheck(playService, [command, ctx]);
    const serviceNames = names(service);
    const uiSchema = meta.uiSchema || {};

    const syncedAggregate = playwithErrorCheck(playGetNodeFromSyncedNodes, [aggregate, ctx.syncedNodes]);
    const aggregateState = playwithErrorCheck(playFindAggregateState, [syncedAggregate, ctx, config.types]);
    const aggregateStateMeta = playwithErrorCheck(playVoMetadata, [aggregateState, ctx, config.types]);
    const dependencies = meta.dependencies;
    const deleteState = !!meta.deleteState;
    const deleteHistory = !!meta.deleteHistory;

    playwithErrorCheck(playEnsureAllRefsAreKnown, [command, meta.schema, config.types]);

    const cmdFQCN = `${serviceNames.className}.${cmdNames.className}`;
    const aggregateFQCN = `${serviceNames.className}.${names(aggregate.getName()).className}`;

    const pbInfo = playUpdateProophBoardInfo(command, ctx, config.commands[cmdFQCN]?.desc);

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
