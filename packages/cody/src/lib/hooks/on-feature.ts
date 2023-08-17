import { CodyHook, Node } from "@proophboard/cody-types";
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
    
    // feature.getChildren().forEach(function(elem) {
    //   console.log(elem.getName(), elem.getSources().first()?.getName(), elem.getTargets().first()?.getName());
    // });

    // check if either the feature (the test) or its bounded context (the test container) have their mode set to "test"
    if (featureMeta[modeKey] == modeValueTest || parentContainerMeta[modeKey] == modeValueTest) {

      // TODO: generate & run tests

      return {
        cody: `Running test called "${feature.getName().trim()}".`,
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
