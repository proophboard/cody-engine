import express, {json} from 'express';
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {getConfiguredCommandBus} from "@server/infrastructure/configuredCommandBus";
import {names} from "@event-engine/messaging/helpers";

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 4100;

const app = express();
const messageBox = getConfiguredMessageBox();
const commandBus = getConfiguredCommandBus();

app.use(json());

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

app.get('/health', (req, res) => {
  res.send({ message: "It Works" });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
