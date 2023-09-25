import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {namespaceToFilePath} from "./namespace";
import {ValueObjectMetadata} from "@cody-engine/cody/hooks/utils/value-object/types";

export const voPath = (vo: Node, voMeta: ValueObjectMetadata, ctx: Context): string | CodyResponse => {
  const service = detectService(vo, ctx);

  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);

  return `${ctx.sharedSrc}/types/${serviceNames.fileName}${namespaceToFilePath(voMeta.ns)}`;
}
