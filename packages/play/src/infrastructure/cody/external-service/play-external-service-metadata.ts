import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {PlayServiceConfig} from "@cody-play/state/types";
import {playParseJsonMetadata} from "@cody-play/infrastructure/cody/metadata/play-parse-json-metadata";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

export interface PlayExternalServiceMeta {
  mock: PlayServiceConfig;
}

export const playExternalServiceMetadata = (service: Node, ctx: ElementEditedContext): PlayExternalServiceMeta | CodyResponse => {
  const meta = playParseJsonMetadata(service) as PlayExternalServiceMeta | CodyResponse;

  if(playIsCodyError(meta)) {
    return meta;
  }

  if(!meta.mock) {
    return {
      cody: `Cannot add service "${service.getName()}". Metadata does not contain a mock configuration for the Cody Play environment.`,
      type: CodyResponseType.Error
    }
  }

  return meta;
}
