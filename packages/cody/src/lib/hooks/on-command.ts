import {CodyHook, Node, NodeRecord, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import { JSONSchema7} from "json-schema-to-ts";
import {names} from "@event-engine/messaging/helpers";
import {flushChanges} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";
import {
  getSingleTarget,
  getTargetsOfType,
  isCodyError,
  nodeNameToPascalCase,
} from "@proophboard/cody-utils";
import {detectService} from "./utils/detect-service";
import {findAggregateState} from "./utils/aggregate/find-aggregate-state";
import {asyncWithErrorCheck, CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {toJSON} from "./utils/to-json";
import {register, registerAggregateCommandHandler, registerCommandHandler} from "./utils/registry";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {UiSchema} from "@rjsf/utils";
import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {ensureAllRefsAreKnown} from "./utils/json-schema/ensure-all-refs-are-known";
import {upsertCommandComponent} from "./utils/ui/upsert-command-component";
import {onAggregate} from "@cody-engine/cody/hooks/on-aggregate";
import {List} from "immutable";
import {Rule} from "@cody-engine/cody/hooks/rule-engine/configuration";
import {getCommandMetadata} from "@cody-engine/cody/hooks/utils/command/command-metadata";
import {alwaysRecordEvent} from "@cody-engine/cody/hooks/utils/aggregate/always-record-event";
import {
  convertRuleConfigToCommandHandlingBehavior
} from "@cody-engine/cody/hooks/rule-engine/convert-rule-config-to-behavior";

export interface CommandMeta {
  newAggregate: boolean;
  schema: JSONSchema7;
  aggregateCommand: boolean;
  streamCommand: boolean;
  service?: string;
  uiSchema?: UiSchema;
  dependencies?: DependencyRegistry;
  rules?: Rule[];
  deleteState?: boolean;
  deleteHistory?: boolean;
  uiDisableFetchState?: boolean;
  streamId?: string;
  streamName?: string;
  publicStream?: string;
}

export const onCommand: CodyHook<Context> = async (command: Node, ctx: Context) => {

  try {
    const cmdNames = names(command.getName());
    const aggregate = getSingleTarget(command, NodeType.aggregate);

    const service = withErrorCheck(detectService, [command, ctx]);
    const serviceNames = names(service);
    const meta = withErrorCheck(getCommandMetadata, [command, ctx]);
    const uiSchema = meta.uiSchema || {};
    const dependencies = meta.dependencies;

    let isAggregateCommand = !isCodyError(aggregate);
    let aggregateName = '';
    let aggregateIdentifier = '';
    let deleteState = false;
    let deleteHistory = false;

    if(meta.aggregateCommand) {
      const aggregateState = withErrorCheck(findAggregateState, [command, ctx]);
      aggregateName = nodeNameToPascalCase(aggregateState);
      const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);
      aggregateIdentifier = aggregateStateMeta.identifier || 'id';
      deleteState = !!meta.deleteState;
      deleteHistory = !!meta.deleteHistory;

      if(!isAggregateCommand) {
        const events = getTargetsOfType(command, NodeType.event);

        if(!isCodyError(events)) {
          await asyncWithErrorCheck(onAggregate, [makeTempAggregateFromCommand(command, aggregateState, events), ctx]);
          isAggregateCommand = true;
        }
      }
    }

    withErrorCheck(ensureAllRefsAreKnown, [command, meta.schema]);

    const {tree} = ctx;

    generateFiles(tree, __dirname + '/command-files/shared', ctx.sharedSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      // Please note: The order of substitutions is important here, because ProophBoardInfo contains "aggregateName"
      // but it's a combined name of Service.Aggregate. The template itself requires "aggregateName" without Service
      // which is defined below and therefor has precedence over the variable from ProophBoardInfo
      ...withErrorCheck(updateProophBoardInfo, [command, ctx, tree]),
      serviceNames,
      isAggregateCommand: meta.aggregateCommand,
      isStreamCommand: meta.streamCommand,
      streamName: meta.streamName,
      publicStream: meta.publicStream,
      streamId: meta.streamId,
      newAggregate: meta.newAggregate,
      aggregateName,
      aggregateIdentifier,
      toJSON,
      ...cmdNames,
      schema: meta.schema,
      uiSchema,
      dependencies,
      deleteState,
      deleteHistory,
    });

    withErrorCheck(register, [command, ctx, tree]);
    await asyncWithErrorCheck(upsertCommandComponent, [command, ctx, tree]);

    if(!meta.aggregateCommand) {
      const events = withErrorCheck(getTargetsOfType, [command, NodeType.event, true]);

      const rules = meta.rules || [];

      if(rules.length === 0) {
        events.forEach(evt => rules.push(alwaysRecordEvent(evt)))
      }

      const behavior = withErrorCheck(convertRuleConfigToCommandHandlingBehavior, [
        command,
        ctx,
        rules,
        [
          {
            name: 'command',
            initializer: 'command.payload',
          },
          {
            name: 'meta',
            initializer: 'command.meta',
          }
        ]
      ]);

      generateFiles(tree, __dirname + '/command-handler-files/be', ctx.beSrc, {
        'tmpl': '',
        'service': serviceNames.fileName,
        'command': cmdNames.fileName,
        serviceNames,
        commandNames: cmdNames,
        behavior,
        events: events.map(evt => names(evt.getName()))
      });

      withErrorCheck(registerCommandHandler, [service, command, ctx, tree]);
    }

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

const makeTempAggregateFromCommand = (command: Node, aggregateState: Node, events: List<Node>): Node => {
  return new NodeRecord({
    id: 'tmp_ar_from_cmd_' + command.getId(),
    name: aggregateState.getName(),
    type: NodeType.aggregate,
    link: command.getLink(),
    sourcesList: List([command]),
    targetsList: events,
  })
}
