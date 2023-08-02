import {RequestHandler} from "express";
import {env} from "@server/environments/environment.current";

export const CE_USER_HEADER = 'ce-user';

export const ensureCEUserIsNotSetInProductionMode: RequestHandler = (req, res, next) => {
  if(env.mode === "production-stack" && req.header(CE_USER_HEADER)) {
    throw new Error('Detected a Ce-User header in a request in production mode: ' + req.originalUrl);
  }

   next();
}
