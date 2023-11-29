import {CodyHook, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {getSingleTarget, isCodyError, parseJsonMetadata} from "@proophboard/cody-utils";
import {Context} from "./context";
import {getOriginalNode} from "./utils/get-original-node";
import {names} from "@event-engine/messaging/helpers";
import {formatFiles, generateFiles} from "@nx/devkit";
import {CodyResponseException, withErrorCheck} from "./utils/error-handling";
import {detectService} from "./utils/detect-service";
import {flushChanges} from "nx/src/generators/tree";
import {listChangesForCodyResponse} from "./utils/fs-tree";
import {getNodeFromSyncedNodes} from "@cody-engine/cody/hooks/utils/node-tree";
import {findAggregateState} from "@cody-engine/cody/hooks/utils/aggregate/find-aggregate-state";
import {getVoMetadata} from "@cody-engine/cody/hooks/utils/value-object/get-vo-metadata";

const modeKey = "mode";
const modeValueTest = "test-scenario";
const givenKey = "given";
const whenKey = "when";
const thenKey = "then";

export const onFeature: CodyHook<Context> = async (feature: Node, ctx: Context) => {
  try {
    feature = getOriginalNode(feature, ctx);
    const featureMeta : any = feature?.getMetadata() ? parseJsonMetadata<{service?: string, mode?: string}>(feature) : {};
    const parentContainer = feature.getParent();
    const parentContainerMeta : any = parentContainer?.getMetadata() ? parseJsonMetadata<{service?: string}>(parentContainer) : {};

    if (featureMeta[modeKey] != modeValueTest && parentContainerMeta[modeKey] != modeValueTest) {
      return {
        cody: "Feature code generation is not yet implemented",
      }
    }

    // add all test nodes to a map with their ID as the key, for easy access
    const validTestNodes = [NodeType.command, NodeType.event];
    const testNodesMap = new Map<any, Node>();
    feature.getChildren().forEach(function(elem) {
      if (validTestNodes.includes(elem.getType())) {
        testNodesMap.set(elem.getId(), elem);
      }
    });

    let whenCommand : Node | undefined;

    // find "when" command node
    feature.getChildren().forEach(function(elem) {
      if (elem.getType() == NodeType.command) {
        whenCommand = elem;
      }
    });

    if (!whenCommand) {

      return {
        cody: "Feature code generation is not yet implemented",
      }
    }

    const givenNodes : Array<Node> = [];
    const thenNodes : Array<Node> = [];
    let currentNode : Node | undefined = whenCommand;

    // everything before the "when" command node is seen as "given"
    while (currentNode) {
      currentNode = testNodesMap.get(currentNode.getSources().first()?.getId()) || undefined;

      if (currentNode) {
        givenNodes.unshift(currentNode);
      }
    }

    // everything after the "when" command is "then"
    currentNode = whenCommand;
    while (currentNode) {
      currentNode = testNodesMap.get(currentNode.getTargets().first()?.getId()) || undefined;

      if (currentNode) {
        thenNodes.push(currentNode);
      }
    }

    const changesForCodyResponse = await createTestFiles(feature.getName(), featureMeta, givenNodes, whenCommand, thenNodes, ctx);

    // for logging:
    const loggedNodes: Array<string> = [];
    loggedNodes.push("GIVEN");
    givenNodes.forEach(function(node) {
      loggedNodes.push(node.getName());
    });
    loggedNodes.push("WHEN");
    loggedNodes.push(whenCommand.getName());
    loggedNodes.push("THEN");
    thenNodes.forEach(function(node) {
      //@ToDo extract and slice expectedIdentifier
      loggedNodes.push(node.getName());
    });

    return {
      cody: `Running test called "${feature.getName().trim()}".\nThese are the nodes included in the test: ${loggedNodes.toString()}`,
      details: changesForCodyResponse
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}

async function createTestFiles(featureName: string, featureMeta: any, givenNodes : Array<Node>, whenCommand : Node, thenNodes : Array<Node>, ctx: Context): Promise<string> {
  // if using a service from another board (e.g. Fleet Management), make sure to set this up in the test feature's metadata!
  const service = withErrorCheck(detectService, [whenCommand, ctx]);

  let aggregate: Node | undefined;
  for (const [, syncedNode] of ctx.syncedNodes) {
    if(syncedNode.getType() === NodeType.command && syncedNode.getName() === whenCommand.getName()
      && syncedNode.getTags().contains('pb:connected')) {
      const aggregateObj = getSingleTarget(syncedNode, NodeType.aggregate);

      if(!isCodyError(aggregateObj)) {
        aggregate = aggregateObj;
        break;
      }
    }
  }

  if (!aggregate) {
    throw new CodyResponseException({
      cody: 'Could not find aggregate for test generation.',
      type: CodyResponseType.Error
    });
  }

  const givenNode = givenNodes[0];
  const syncedAggregate = withErrorCheck(getNodeFromSyncedNodes, [aggregate, ctx.syncedNodes]);
  const aggregateState = withErrorCheck(findAggregateState, [syncedAggregate, ctx]);
  const aggregateStateMeta = withErrorCheck(getVoMetadata, [aggregateState, ctx]);
  const aggregateStateNames = names(aggregateState.getName());

  const thenNode = thenNodes[0];
  const body = '{'+thenNode.getDescription().replaceAll('\'', '"')+'}';
  console.log('Json body: '+ body);
  const thenNodeDescriptionObject = JSON.parse(body);

  const aggregateIdentifierProperty = aggregateStateMeta.identifier as keyof typeof thenNodeDescriptionObject;
  const givenAggregateMetaType = `${names(service).className}.${names(aggregate.getName()).className}`;

  // TODO: currently only using the first "when" & "then" nodes
  const substitutions = {
    'tmpl': '',
    "feature": names(featureName).className,
    "serviceNames": names(service),
    "featureNames": names(featureName),
    "given": featureMeta[givenKey],
    "when": featureMeta[whenKey],
    "then": featureMeta[thenKey],
    "givenEvent": names(givenNode.getName()),
    "givenAggregateMetaType": givenAggregateMetaType,
    "whenEvent": names(whenCommand.getName()),
    "thenEvent": names(thenNodes[0].getName()),
    "givenPayload": givenNode.getDescription(),
    "whenPayload": whenCommand.getDescription(),
    "thenPayload": thenNodes[0].getDescription(),
    "aggregate": names(aggregate.getName()).fileName,
    "expectedIdentifier": thenNodeDescriptionObject[aggregateIdentifierProperty]
  }

  // generate test files
  const {tree} = ctx;
  generateFiles(tree, __dirname + '/behaviour-test-files', ctx.beSrc+'/../', substitutions);
  await formatFiles(tree);
  const changes = tree.listChanges();
  flushChanges(ctx.projectRoot, changes);

  return listChangesForCodyResponse(tree);
}
