import {Node, NodeType} from "@proophboard/cody-types";
import {getSingleSource, getSourcesOfType, isCodyError} from "@proophboard/cody-utils";

export const selectVoForProjectionGeneration = (projectionVo: Node): Node => {
  const events = getSourcesOfType(projectionVo, NodeType.event, true);

  if(isCodyError(events) || events.count() === 0) {
    const stateVo = getSingleSource(projectionVo, NodeType.document);

    if(isCodyError(stateVo)) {
      return projectionVo;
    }

    return stateVo;
  }

  return projectionVo;
}
