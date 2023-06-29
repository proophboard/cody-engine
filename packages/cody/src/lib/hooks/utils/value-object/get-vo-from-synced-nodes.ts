import {Context} from "../../context";
import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {splitVOFQCN} from "./definitions";
import {names} from "@event-engine/messaging/helpers";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {getVoMetadata} from "./get-vo-metadata";
import {namespaceToJSONPointer} from "./namespace";

export const getVoFromSyncedNodes = (voFQCN: string, ctx: Context): Node | CodyResponse => {
  const [service, ns, className] = splitVOFQCN(voFQCN);

  const voCandidates = ctx.syncedNodes.filter(n => n.getType() === NodeType.document && names(n.getName()).className === className);

  for (const [,voCandidate] of voCandidates) {
    const candidateService = detectService(voCandidate, ctx);

    if(!isCodyError(candidateService) && candidateService === service) {
      const candidateMeta = getVoMetadata(voCandidate, ctx);

      if(!isCodyError(candidateMeta) && namespaceToJSONPointer(candidateMeta.ns) === namespaceToJSONPointer(ns)) {
        return voCandidate
      }
    }
  }

  return {
    cody: `I could not find a document card in synced nodes for value object: "${voFQCN}"`,
    type: CodyResponseType.Error,
    details: `I tried to match all parts:\nservice: ${service}\nnamespace: ${ns}\nname: ${className}\n\nMaybe you have made a spelling mistake in the value object name?`
  }
}
