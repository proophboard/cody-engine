import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  CodyResponseException,
  playwithErrorCheck
} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {names} from "@event-engine/messaging/helpers";
import {
  playExternalServiceMetadata
} from "@cody-play/infrastructure/cody/external-service/play-external-service-metadata";

export const onExternalService = async (service: Node, dispatch: PlayConfigDispatch, ctx: ElementEditedContext, config: CodyPlayConfig): Promise<CodyResponse> => {
  try {
    const serviceNames = names(service.getName());

    const meta = playwithErrorCheck(playExternalServiceMetadata, [service, ctx]);

    dispatch({
      ctx,
      type: "ADD_SERVICE",
      name: serviceNames.className,
      config: meta.mock
    })

    return {
      cody: `Service "${service.getName()}" is available now.`
    }
  } catch (e) {
    if(e instanceof CodyResponseException) {
      return e.codyResponse;
    }

    throw e;
  }
}
