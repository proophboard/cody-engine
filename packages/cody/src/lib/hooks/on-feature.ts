import { CodyHook, Node, NodeType } from "@proophboard/cody-types";
import { parseJsonMetadata } from "@proophboard/cody-utils";
import { Context } from "./context";
import { CodyResponseException } from "./utils/error-handling";
import { getOriginalNode } from "./utils/get-original-node";

const modeKey = "mode";
const modeValueTest = "test";

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
          console.log("found WHEN command:", elem.getName(), elem.getSources().first()?.getName(), elem.getTargets().first()?.getName());
        }
      });

      if (whenCommand) {
        let givenNodes : Array<Node> = [];
        let thenNodes : Array<Node> = [];
        let currentNode : Node | undefined = whenCommand;

        // everything before the "when" command node is seen as "given"
        while (currentNode) {
          currentNode = testNodesMap.get(currentNode.getSources().first()?.getId()) || undefined;

          if (currentNode) {
            givenNodes.unshift(currentNode);
            // console.log(currentNode.getName(), currentNode.getSources().count());
          }
        }

        // everything after the "when" command is "then"
        currentNode = whenCommand;
        while (currentNode) {
          currentNode = testNodesMap.get(currentNode.getTargets().first()?.getId()) || undefined;

          if (currentNode) {
            thenNodes.push(currentNode);
            // console.log(currentNode.getName(), currentNode.getTargets().count());
          }
        }
        
        // for logging:
        var loggedNodes : Array<String> = [];
        givenNodes.forEach(function(node) {
          loggedNodes.push(node.getName());
        });
        loggedNodes.push(whenCommand.getName());
        thenNodes.forEach(function(node) {
          loggedNodes.push(node.getName());
        });

        return {
          cody: `Running test called "${feature.getName().trim()}".\nThese are the nodes included in the test: ${loggedNodes.toString()}`,
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
