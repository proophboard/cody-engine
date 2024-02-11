import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "@cody-engine/cody/hooks/context";
import {detectService} from "@cody-engine/cody/hooks/utils/detect-service";
import {names} from "@event-engine/messaging/helpers";
import {isCodyError} from "@proophboard/cody-utils";
import {getVoMetadata} from "@cody-engine/cody/hooks/utils/value-object/get-vo-metadata";
import {namespaceToJSONPointer} from "@cody-engine/cody/hooks/utils/value-object/namespace";

export const voRegistryId = (vo: Node, ctx: Context): string | CodyResponse => {
  const service = detectService(vo, ctx);

  if(isCodyError((service))) {
    return service;
  }

  const serviceNames = names(service);

  const voNames = names(vo.getName());
  const voMeta = getVoMetadata(vo, ctx);

  if(isCodyError(voMeta)) {
    return voMeta;
  }

  const nsJSONPointer = namespaceToJSONPointer(voMeta.ns);

  return `${serviceNames.className}${nsJSONPointer}${voNames.className}`;
}
