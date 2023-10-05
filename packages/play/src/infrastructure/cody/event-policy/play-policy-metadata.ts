import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {PolicyMeta} from "@cody-engine/cody/hooks/utils/policy/metadata";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

export const playEventPolicyMetadata = (policy: Node, ctx: ElementEditedContext): PolicyMeta | CodyResponse => {
  const meta = playParseJsonMetadata(policy) as PolicyMeta | CodyResponse;

  if(playIsCodyError(meta)) {
    return meta;
  }

  return meta as PolicyMeta;
}
