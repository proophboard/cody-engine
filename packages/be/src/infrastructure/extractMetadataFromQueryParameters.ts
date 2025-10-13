import { IncomingMessage } from 'http';
import { Meta } from '@event-engine/messaging/message';
import * as url from 'node:url';
import { Pagination } from '@app/shared/utils/paginator';

export const extractMetadataFromQueryParameters = async <M extends Meta = any>(
  req: IncomingMessage & { auth?: object }
): Promise<M> => {
  const meta: Record<string, any> = {};

  if (!req.url) {
    return meta as M;
  }

  const queryData = url.parse(req.url, true).query;
  const pagination: Record<string, number> = {};

  for (const paramName in queryData) {
    if (paramName !== 'limit' && paramName !== 'skip') {
      continue;
    }

    const queryParamNumber = Number(queryData[paramName]);

    if (queryParamNumber > 0) {
      pagination[paramName] = queryParamNumber;
    }
  }
  if (Object.values(pagination).length) {
    meta['pagination'] = pagination;
  }

  return meta as M;
};
