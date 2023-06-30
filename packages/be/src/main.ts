import express, {ErrorRequestHandler, json, NextFunction} from 'express';
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {getConfiguredCommandBus} from "@server/infrastructure/configuredCommandBus";
import {names} from "@event-engine/messaging/helpers";
import {getConfiguredQueryBus} from "@server/infrastructure/configuredQueryBus";
import {ValidationError} from "ajv";
import 'express-async-errors';
import {NotFoundError} from "@event-engine/messaging/error/not-found-error";

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 4100;

const app = express();
const messageBox = getConfiguredMessageBox();
const commandBus = getConfiguredCommandBus();
const queryBus = getConfiguredQueryBus();

app.use(json());

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
    const cmd = cmdInfo.factory(req.body);
    const success = await commandBus.dispatch(cmd, cmdInfo.desc);
    res.json({success});
    return;
  }

  // @TODO implement event handling

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
  const query = queryInfo.factory(req.query);

  res.json(await queryBus.dispatch(query, queryInfo.desc));
});

app.get('/health', (req, res) => {
  res.send({ message: "It Works" });
});

app.use(errorHandler);

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
