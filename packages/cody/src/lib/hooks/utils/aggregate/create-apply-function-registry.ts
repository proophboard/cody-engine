import {Context} from "../../context";
import {FsTree} from "nx/src/generators/tree";
import {CodyResponse, Node} from "@proophboard/cody-types";
import {names} from "@event-engine/messaging/helpers";
import {CodyResponseException, withErrorCheck} from "../error-handling";
import {detectService} from "../detect-service";
import {findAggregateState} from "./find-aggregate-state";
import {getVoMetadata} from "../value-object/get-vo-metadata";
import {generateFiles} from "@nx/devkit";
import {namespaceToFilePath} from "../value-object/namespace";

export const createApplyFunctionRegistryIfNotExists = (aggregateState: Node, ctx: Context, tree: FsTree): boolean | CodyResponse => {
  try {
    const aggregateNames = names(aggregateState.getName());
    const service = withErrorCheck(detectService, [aggregateState, ctx]);
    const serviceNames = names(service);

    if(tree.exists(`${ctx.beSrc}/event-reducers/${serviceNames.fileName}/${aggregateNames.fileName}/index.ts`)) {
      return true;
    }

    const aggregateStateNames = names(aggregateState.getName());
    const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);

    generateFiles(tree, __dirname + '/../../aggregate-files-only-new/be/event-reducers', ctx.beSrc + '/event-reducers', {
      'tmpl': '',
      'service': serviceNames.fileName,
      'aggregate': aggregateNames.fileName,
      serviceNames,
      aggregateStateNames: {
        ...aggregateStateNames,
        fileNameWithNamespace: `${namespaceToFilePath(aggregateStateMeta.ns)}${aggregateStateNames.fileName}`,
      },
      ...aggregateNames,
    });

    return true;
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
