import {CodyResponse, Node, NodeType} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {names} from "@event-engine/messaging/helpers";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {playFindParentByType} from "@cody-play/infrastructure/cody/node-traversing/node-tree";

export const playService = (node: Node, ctx: ElementEditedContext): string | CodyResponse => {
  const meta = node.getMetadata() ? playParseJsonMetadata<{service?: string}>(node) : {};

  if(playIsCodyError(meta)) {
    return meta;
  }

  if(meta.service && typeof meta.service === 'string') {
    return names(meta.service).className;
  }

  const feature = playFindParentByType(node, NodeType.feature);

  if(feature) {
    const featureMeta = playParseJsonMetadata<{service?: string}>(feature);

    if(!playIsCodyError(featureMeta)) {
      if(featureMeta.service) {
        return names(featureMeta.service).className;
      }
    }
  }

  const bc = playFindParentByType(node, NodeType.boundedContext);

  if(bc) {
    const bcMeta = playParseJsonMetadata<{service?: string}>(bc);
    if(!playIsCodyError(bcMeta) && bcMeta.service) {
      return names(bcMeta.service).className;
    }
  }

  return names(ctx.boardName).className;
}
