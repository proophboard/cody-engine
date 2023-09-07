import express, {ErrorRequestHandler, json} from 'express';
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {names} from "@event-engine/messaging/helpers";
import {ValidationError} from "ajv";
import 'express-async-errors';
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {extractMetadataFromHeaders} from "@server/infrastructure/extractMetadataFromHeaders";
import {ensureCEUserIsNotSetInProductionMode} from "@server/infrastructure/ensureCEUserIsNotSetInProductionMode";
import {getExternalServiceOrThrow} from "@server/extensions/get-external-service";
import {AuthService} from "@server/infrastructure/auth-service/auth-service";

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 4100;

const app = express();
const messageBox = getConfiguredMessageBox();
const authService = getExternalServiceOrThrow<AuthService>('AuthService', {});

app.use(json());
app.use(ensureCEUserIsNotSetInProductionMode);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if(err instanceof ValidationError) {
    res.status(400).send({
      message: "Validation failed",
      errors: err.errors
    });
  } else if (err instanceof NotFoundError) {
    res.status(404).send({
      message: err.message
    })
  } else {
    console.error(err.stack);
    res.status(500).send({message: "Internal server error"});
  }
}

app.post('/api/:module/messages/:name', async (req, res) => {
  const module = names(req.params.module).className;
  const messageName = names(req.params.name).className;
  const fqcn = `${module}.${messageName}`;

  if(messageBox.isCommand(fqcn)) {
    const cmdInfo = messageBox.getCommandInfo(fqcn);
    const cmd = cmdInfo.factory(req.body, await extractMetadataFromHeaders(req, authService));
    const success = await messageBox.commandBus.dispatch(cmd, cmdInfo.desc);
    res.json({success});
    return;
  }

  if(messageBox.isEvent(fqcn)) {
    const evtInfo = messageBox.getEventInfo(fqcn);
    const evt = evtInfo.factory(req.body, await extractMetadataFromHeaders(req, authService));
    const success = await messageBox.eventBus.on(evt);
    res.json({success});
    return;
  }

  throw new Error(`Unknown message received: "${fqcn}"`);
})

app.post('/api/:module/messages/:aggregate/:name', async (req, res) => {
  const module = names(req.params.module).className;
  const aggregate = names(req.params.aggregate).className;
  const messageName = names(req.params.name).className;
  const fqcn = `${module}.${aggregate}.${messageName}`;


  if(messageBox.isEvent(fqcn)) {
    const evtInfo = messageBox.getEventInfo(fqcn);
    const evt = evtInfo.factory(req.body, await extractMetadataFromHeaders(req, authService));
    const success = await messageBox.eventBus.on(evt);
    res.json({success});
    return;
  }

  throw new Error(`Unknown message received: "${fqcn}"`);
})

app.get('/api/:module/messages/:name', async (req, res) => {
  const module = names(req.params.module).className;
  const messageName = names(req.params.name).className;
  const fqcn = `${module}.${messageName}`;

  if(!messageBox.isQuery(fqcn)) {
    throw new Error(`Unknown message received: "${fqcn}"`);
  }

  const queryInfo = messageBox.getQueryInfo(fqcn);
  const query = queryInfo.factory(determineQueryPayload(req.query, queryInfo), await extractMetadataFromHeaders(req, authService));

  res.json(await messageBox.queryBus.dispatch(query, queryInfo.desc));
});

app.get('/health', (req, res) => {
  res.send({ message: "It Works" });
});

app.get('/api/health', (req, res) => {
  res.send({ message: "It Works" });
});

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
