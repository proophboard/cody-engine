import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "../../context";
import {FsTree} from "nx/src/generators/tree";
import {detectService} from "../detect-service";
import {getSingleTarget, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {generateFiles} from "@nx/devkit";
import {registerCommandComponent} from "../registry";
import {CodyResponseException, withErrorCheck} from "../error-handling";
import {getNodeFromSyncedNodes} from "../node-tree";
import {findAggregateState} from "../aggregate/find-aggregate-state";
import {getVoMetadata} from "../value-object/get-vo-metadata";
import {namespaceNames} from "../value-object/namespace";
import {CommandMeta} from "../../on-command";

export const upsertCommandComponent = async (command: Node, ctx: Context, tree: FsTree): Promise<boolean|CodyResponse> => {

  try {
    const service = withErrorCheck(detectService, [command, ctx]);
    const aggregate = getSingleTarget(command, NodeType.aggregate);
    const commandMeta = withErrorCheck(parseJsonMetadata, [command]) as CommandMeta;

    const isAggregateCommand = !isCodyError(aggregate);

    if(!isAggregateCommand) {
      // @TODO: handle non-aggregate command
      return aggregate;
    }

    const syncedAggregate = withErrorCheck(getNodeFromSyncedNodes, [aggregate, ctx.syncedNodes]);
    const aggregateState = withErrorCheck(findAggregateState, [syncedAggregate, ctx]);
    const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);

    const serviceNames = names(service);
    const commandNames = names(command.getName());
    const stateNames = names(aggregateState.getName());
    const stateNsNames = namespaceNames(aggregateStateMeta.ns);
    const identifier: string | undefined = commandMeta.newAggregate ? undefined : aggregateStateMeta.identifier;

    generateFiles(tree, __dirname + '/../../ui-files/command-files', ctx.feSrc, {
      tmpl: '',
      service: serviceNames.fileName,
      serviceNames,
      stateNames,
      stateNsNames,
      identifier,
      newAggregate: commandMeta.newAggregate,
      ...commandNames
    });

    return registerCommandComponent(service, command, ctx, tree);
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
