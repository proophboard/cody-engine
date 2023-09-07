import {IncomingMessage} from "http";
import {Meta} from "@event-engine/messaging/message";
import {names} from "@event-engine/messaging/helpers";
import {AuthService} from "@server/infrastructure/auth-service/auth-service";

export const CE_HEADER_PREFIX = 'Ce-';

export const extractMetadataFromHeaders = async <M extends Meta = any>(req: IncomingMessage, authService: AuthService): Promise<M> => {
  const meta: Record<string, any> = {};

  for (const headerKey in req.headers) {
    if(headerKey.match(/^ce-/)) {
      const metaKey = names(headerKey.replace('ce-', '')).propertyName;

      if(metaKey === 'user') {
        meta[metaKey] = await authService.get(req.headers[headerKey] as string);
      } else {
        meta[metaKey] = req.headers[headerKey];
      }
    }
  }

  return meta as M;
}
