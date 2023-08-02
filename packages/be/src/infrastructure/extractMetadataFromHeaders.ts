import {IncomingMessage} from "http";
import {Meta} from "@event-engine/messaging/message";
import {names} from "@event-engine/messaging/helpers";

export const CE_HEADER_PREFIX = 'Ce-';

export const extractMetadataFromHeaders = <M extends Meta = any>(req: IncomingMessage): M => {
  const meta: Record<string, any> = {};

  for (const headerKey in req.headers) {
    if(headerKey.match(/^ce-/)) {
      const metaKey = names(headerKey.replace('ce-', '')).propertyName;
      meta[metaKey] = req.headers[headerKey];
    }
  }

  return meta as M;
}
