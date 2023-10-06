import { CodyHook, Node, NodeType } from "@proophboard/cody-types";
import { parseJsonMetadata } from "@proophboard/cody-utils";
import { Context } from "./context";
import { getOriginalNode } from "./utils/get-original-node";
import { names} from "@event-engine/messaging/helpers";
import { formatFiles, generateFiles } from "@nx/devkit";
import { CodyResponseException, withErrorCheck } from "./utils/error-handling";
import { detectService } from "./utils/detect-service";
import {flushChanges} from "nx/src/generators/tree";
import {listChangesForCodyResponse} from "./utils/fs-tree";

const modeKey = "mode";
const modeValueTest = "test-scenario";
const givenKey = "given";
const whenKey = "when";
const thenKey = "then";

export const onFeature: CodyHook<Context> = async (feature: Node, ctx: Context) => {
  try {
    feature = getOriginalNode(feature, ctx);
    const featureMeta : any = feature?.getMetadata() ? parseJsonMetadata<{service?: string}>(feature) : {};
    const parentContainer = feature.getParent();
    const parentContainerMeta : any = parentContainer?.getMetadata() ? parseJsonMetadata<{service?: string}>(parentContainer) : {};

    // add all test nodes to a map with their ID as the key, for easy access
    const validTestNodes = [NodeType.command, NodeType.event];
    const testNodesMap = new Map<any, Node>();
    feature.getChildren().forEach(function(elem) {
      if (validTestNodes.includes(elem.getType())) {
        testNodesMap.set(elem.getId(), elem);
      }
    });

    // check if either the feature (the test) or its bounded context (the test container) have their mode set to "test"
    if (featureMeta[modeKey] == modeValueTest || parentContainerMeta[modeKey] == modeValueTest) {

      let whenCommand : Node | undefined;

      // find "when" command node
      feature.getChildren().forEach(function(elem) {
        if (elem.getType() == NodeType.command) {
          whenCommand = elem;
        }
      });

      if (whenCommand) {
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
      }
    }

    return {
      cody: "Feature code generation is not yet implemented",
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

  const aggregate = 'car';

  // TODO: currently only using the first "when" & "then" nodes
  const substitutions = {
    'tmpl': '',
    "feature": names(featureName).className,
    "serviceNames": names(service),
    "featureNames": names(featureName),
    "given": featureMeta[givenKey],
    "when": featureMeta[whenKey],
    "then": featureMeta[thenKey],
    "givenEvent": names(givenNodes[0].getName()),
    "whenEvent": names(whenCommand.getName()),
    "thenEvent": names(thenNodes[0].getName()),
    "givenPayload": givenNodes[0].getDescription(),
    "whenPayload": whenCommand.getDescription(),
    "thenPayload": thenNodes[0].getDescription(),
    "aggregate": aggregate,
    "expectedIdentifier": "6a76bead-46ce-4651-bea0-d8a387b2e9d0" // TODO: read from "then" node payload (convert to json, read & remove "expectedIdentifier", convert back to string)
  }
  // console.log(substitutions);

  // generate test files
  const {tree} = ctx;
  generateFiles(tree, __dirname + '/behaviour-test-files', ctx.beSrc+'/../', substitutions);
  await formatFiles(tree);
  const changes = tree.listChanges();
  flushChanges(ctx.projectRoot, changes);

  return listChangesForCodyResponse(tree);
}
