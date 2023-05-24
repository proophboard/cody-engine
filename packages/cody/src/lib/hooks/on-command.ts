import {CodyHook, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {JSONSchema, JSONSchema7} from "json-schema-to-ts";
import {convertShorthandObjectToJsonSchema, ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {names} from "@event-engine/messaging/helpers";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {generateFiles} from "@nx/devkit";
import {
  isCodyError,
  nodeNameToPascalCase,
  parseJsonMetadata,
  getSingleTarget
} from "@proophboard/cody-utils";
import {detectService} from "./utils/detect-service";
import {findAggregateState} from "./utils/aggregate/find-aggregate-state";
import {getNodeFromSyncedNodes} from "./utils/node-tree";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {toJSON} from "./utils/to-json";
import {register} from "./utils/registry";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";

interface CommandMeta {
  newAggregate: boolean;
  shorthand: boolean;
  schema: JSONSchema | ShorthandObject;
  service?: string;
}

export const onCommand: CodyHook<Context> = async (command: Node, ctx: Context) => {

  try {
    const cmdNames = names(command.getName());
    const aggregate = getSingleTarget(command, NodeType.aggregate);
    const service = withErrorCheck(detectService, [command, ctx]);
    const serviceNames = names(service);
    const meta = withErrorCheck(parseJsonMetadata, [command]) as CommandMeta;

    let schema: any = meta.schema || {};
    if(meta.shorthand) {
      schema = withErrorCheck(convertShorthandObjectToJsonSchema, [schema as ShorthandObject]);
    }

    if(typeof schema === "object" && !schema.hasOwnProperty('$id')) {
      schema['$id'] = `/definitions/${serviceNames.fileName}/commands/${cmdNames.fileName}`;
    }

    const isAggregateCommand = !isCodyError(aggregate);

    if(!isAggregateCommand) {
      // @TODO: handle non-aggregate command
      return aggregate;
    }

    // @TODO: handle command dependencies

    const syncedAggregate = withErrorCheck(getNodeFromSyncedNodes, [aggregate, ctx.syncedNodes]);
    const aggregateState = withErrorCheck(findAggregateState, [syncedAggregate, ctx]);
    const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);

    const tree = new FsTree(ctx.projectRoot, true);

    generateFiles(tree, __dirname + '/command-files/shared', ctx.sharedSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      serviceNames,
      isAggregateCommand,
      newAggregate: meta.newAggregate,
      aggregateName: nodeNameToPascalCase(aggregate),
      aggregateIdentifier: aggregateStateMeta.identifier,
      toJSON,
      ...cmdNames,
      schema,
      ...withErrorCheck(updateProophBoardInfo, [command, ctx, tree])
    });

    withErrorCheck(register, [command, ctx, tree]);

    const changes = tree.listChanges();

    flushChanges(ctx.projectRoot, changes);

    return {
      cody: `Alright, command "${command.getName()}" is available now.`,
      details: listChangesForCodyResponse(tree),
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
