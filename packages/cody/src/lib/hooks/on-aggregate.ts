import {CodyHook, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "./context";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {names} from "@event-engine/messaging/helpers";
import {getSingleSource, getTargetsOfType, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {detectService} from "./utils/detect-service";
import {findAggregateState} from "./utils/aggregate/find-aggregate-state";
import {flushChanges, FsTree} from "nx/src/generators/tree";
import {formatFiles, generateFiles} from "@nx/devkit";
import {getVoMetadata} from "./utils/value-object/get-vo-metadata";
import {namespaceToFilePath, namespaceToJSONPointer} from "./utils/value-object/namespace";
import {updateProophBoardInfo} from "./utils/prooph-board-info";
import {register, registerAggregateRepository, registerCommandHandler} from "./utils/registry";
import {isNewFile, listChangesForCodyResponse} from "./utils/fs-tree";
import {alwaysRecordEvent} from "./utils/aggregate/always-record-event";
import {convertRuleConfigToAggregateBehavior} from "./utils/rule-engine/convert-rule-config-to-behavior";
import {AggregateMetadata} from "./utils/aggregate/metadata";



export const onAggregate: CodyHook<Context> = async (aggregate: Node, ctx: Context) => {
  try {

    const service = withErrorCheck(detectService, [aggregate, ctx]);
    const serviceNames = names(service);
    const command = withErrorCheck(getSingleSource, [aggregate, NodeType.command]);
    const commandNames = names(command.getName());
    const events = withErrorCheck(getTargetsOfType, [aggregate, NodeType.event, true]);
    const aggregateState = withErrorCheck(findAggregateState, [aggregate, ctx]);
    const aggregateStateNames = names(aggregateState.getName());
    const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);
    const meta = aggregate.getMetadata()? withErrorCheck(parseJsonMetadata, [aggregate]) as AggregateMetadata : {};
    const aggregateNames = names(aggregateState.getName());

    const collection = aggregateStateMeta.collection || aggregateStateNames.constantName.toLowerCase() + '_collection';
    const stream = meta.stream || 'write_model_stream';
    const rules = meta.rules || [];

    if(rules.length === 0) {
      events.forEach(evt => rules.push(alwaysRecordEvent(evt)))
    }

    const behavior = withErrorCheck(convertRuleConfigToAggregateBehavior, [
      aggregate,
      ctx,
      rules,
      [
        {
          name: 'information',
          initializer: aggregateStateNames.propertyName
        },
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


    const {tree} = ctx;

    generateFiles(tree, __dirname + '/aggregate-files/shared', ctx.sharedSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      serviceNames,
      'aggregateIdentifier': aggregateStateMeta.identifier,
      collection,
      stream,
      aggregateStateNames: {
        ...aggregateStateNames,
        classNameWithNamespace: `${namespaceToJSONPointer(aggregateStateMeta.ns)}${aggregateStateNames.className}`,
      },
      ...aggregateNames,
      ...withErrorCheck(updateProophBoardInfo, [aggregate, ctx, tree])
    });

    generateFiles(tree, __dirname + '/aggregate-files/be', ctx.beSrc, {
      'tmpl': '',
      'service': serviceNames.fileName,
      'aggregate': aggregateNames.fileName,
      'command': commandNames.fileName,
      serviceNames,
      commandNames,
      behavior,
      aggregateStateNames: {
        ...aggregateStateNames,
        fileNameWithNamespace: `${namespaceToFilePath(aggregateStateMeta.ns)}${aggregateStateNames.fileName}`,
      },
      events: events.map(evt => names(evt.getName())),
      ...aggregateNames,
    });

    if(isNewFile(`${ctx.sharedSrc}/aggregates/${serviceNames.fileName}/${aggregateNames.fileName}.desc.ts`, tree)) {
      generateFiles(tree, __dirname + '/aggregate-files-only-new/be', ctx.beSrc, {
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
    }

    withErrorCheck(register, [aggregate, ctx, tree]);
    withErrorCheck(registerCommandHandler, [service, aggregate, ctx, tree]);
    withErrorCheck(registerAggregateRepository, [service, aggregate, ctx, tree]);

    await formatFiles(tree);

    const changes = tree.listChanges();

    flushChanges(ctx.projectRoot, changes);

    return {
      cody: `Done! A new command handling function of aggregate "${aggregate.getName()}" is added to the system.`,
      details: listChangesForCodyResponse(tree),
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
