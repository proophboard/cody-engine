import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {splitVOFQCN} from "@cody-engine/cody/hooks/utils/value-object/definitions";
import {namespaceToJSONPointer} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {playVoMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {PlayInformationRegistry} from "@cody-play/state/types";

export const playGetVoFromSyncedNodes = (voFQCN: string, ctx: ElementEditedContext, types: PlayInformationRegistry): Node | CodyResponse => {
  const [service, ns, className] = splitVOFQCN(voFQCN);

  const voCandidates = ctx.syncedNodes.filter(n => n.getType() === NodeType.document && names(n.getName()).className === className);

  for (const [,voCandidate] of voCandidates) {
    const candidateService = playService(voCandidate, ctx);

    if(!isCodyError(candidateService) && candidateService === service) {
      const candidateMeta = playVoMetadata(voCandidate, ctx, types);

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

export const playGetVoFromDataReference = (data: string, refNodeService: string, ctx: ElementEditedContext, types: PlayInformationRegistry): Node | CodyResponse => {
  data = data.replace(".", "/");

  if(data[0] === "/") {
    data = data.slice(1);
  }

  const parts = data.split("/");

  if(parts.length < 3) {
    const firstPart = names(parts[0]).className;

    if(firstPart !== refNodeService) {
      parts.unshift(refNodeService);
    }
  }

  data = parts.map(p => names(p).className).join(".");

  return playGetVoFromSyncedNodes(data, ctx, types);
}
