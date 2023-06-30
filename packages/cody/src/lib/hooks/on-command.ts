import {CodyHook, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {JSONSchema, JSONSchema7} from "json-schema-to-ts";
import {convertShorthandObjectToJsonSchema, ShorthandObject} from "@proophboard/schema-to-typescript/lib/jsonschema";
import {names} from "@event-engine/messaging/helpers";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";
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
import {UiSchema} from "@rjsf/utils";
import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {addSchemaTitles} from "./utils/json-schema/add-schema-titles";

export interface CommandMeta {
  newAggregate: boolean;
  shorthand: boolean;
  schema: JSONSchema | ShorthandObject;
  service?: string;
  uiSchema?: UiSchema;
  dependencies?: DependencyRegistry;
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

    schema = addSchemaTitles(command.getName(), schema);

    const uiSchema = meta.uiSchema || {};

    const isAggregateCommand = !isCodyError(aggregate);

    if(!isAggregateCommand) {
      // @TODO: handle non-aggregate command
      return aggregate;
    }

    const syncedAggregate = withErrorCheck(getNodeFromSyncedNodes, [aggregate, ctx.syncedNodes]);
    const aggregateState = withErrorCheck(findAggregateState, [syncedAggregate, ctx]);
    const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);
    const dependencies = meta.dependencies;

    const tree = new FsTree(ctx.projectRoot, true);

    generateFiles(tree, __dirname + '/command-files/shared', ctx.sharedSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      // Please note: The order of substitutions is important here, because ProophBoardInfo contains "aggregateName"
      // but it's a combined name of Service.Aggregate. The template itself requires "aggregateName" without Service
      // which is defined below and therefor has precedence over the variable from ProophBoardInfo
      ...withErrorCheck(updateProophBoardInfo, [command, ctx, tree]),
      serviceNames,
      isAggregateCommand,
      newAggregate: meta.newAggregate,
      aggregateName: nodeNameToPascalCase(aggregate),
      aggregateIdentifier: aggregateStateMeta.identifier,
      toJSON,
      ...cmdNames,
      schema,
      uiSchema,
      dependencies,
    });

    withErrorCheck(register, [command, ctx, tree]);

    await formatFiles(tree);

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
