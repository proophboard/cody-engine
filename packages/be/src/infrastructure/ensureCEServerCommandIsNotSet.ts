import { RequestHandler } from 'express';
import { env } from '@server/environments/environment.current';

export const CE_SERVER_COMMAND = 'ce-server-command';

export const ensureCEUServerCommandIsNotSet: RequestHandler = (
  req,
  res,
  next
) => {
  if (req.header(CE_SERVER_COMMAND)) {
    throw new Error(
      'Detected a Ce-Server-command header in a request: ' + req.originalUrl
    );
  }

  next();
};
