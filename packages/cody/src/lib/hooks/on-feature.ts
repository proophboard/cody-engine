import { CodyHook, Node, NodeType } from "@proophboard/cody-types";
import { parseJsonMetadata } from "@proophboard/cody-utils";
import { Context } from "./context";
import { CodyResponseException } from "./utils/error-handling";
import { getOriginalNode } from "./utils/get-original-node";

const modeKey = "mode";
const modeValueTest = "test";

export const onFeature: CodyHook<Context> = async (feature: Node, ctx: Context) => {
  try {
    // console.log("onFeature");
    feature = getOriginalNode(feature, ctx);
    const featureMeta : any = feature?.getMetadata() ? parseJsonMetadata<{service?: string}>(feature) : {};
    const parentContainer = feature.getParent();
    const parentContainerMeta : any = parentContainer?.getMetadata() ? parseJsonMetadata<{service?: string}>(parentContainer) : {};
    // console.log(parentContainerMeta);

    // check if either the feature (the test) or its bounded context (the test container) have their mode set to "test"
    if (featureMeta[modeKey] == modeValueTest || parentContainerMeta[modeKey] == modeValueTest) {

      let whenCommand : Node | undefined;
    
      // find "when" command node
      feature.getChildren().forEach(function(elem) {
        if (elem.getType() == NodeType.command) {
          whenCommand = elem;
          console.log('found WHEN command:', elem.getName(), elem.getSources().first()?.getName(), elem.getTargets().first()?.getName());
        }
      });

      if (whenCommand) {
        let givenNodes : Array<Node> = [];
        let thenNodes : Array<Node> = [];
        let currentNode : Node = whenCommand;

        console.log("checking for GIVEN");

        // everything before the "when" command node is seen as "given"
        while (!currentNode.getSources().isEmpty()) {
          currentNode = currentNode.getSources().first();
          givenNodes.unshift(currentNode);

          console.log(currentNode.getName(), currentNode.getSources().count());
        }

        // TODO: the source/target lists aren't recursive, so they always only give you direct source/targets, and not their sources/targets! we'd have to fetch those nodes again, somehow

        console.log("checking for THEN");

        // everything after the "when" command is "then"
        currentNode = whenCommand;
        while (!currentNode.getTargets().isEmpty()) {
          currentNode = currentNode.getTargets().first();
          thenNodes.push(currentNode);

          console.log(currentNode.getName());
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

        console.log("running test!");

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
