import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {getConfiguredEventStore, PUBLIC_STREAM, WRITE_MODEL_STREAM} from "@server/infrastructure/configuredEventStore";
import * as process from "process";
import {Command} from "commander";
import {DEFAULT_READ_MODEL_PROJECTION} from "@event-engine/infrastructure/Projection/types";
import {getConfiguredEventBus} from "@server/infrastructure/configuredEventBus";

// Do not remove messageBox, without that import the script fails
// Somehow ts-node is not able to load the event store module correctly
// Doing the message box import first solves the problem
// It seems to be a strange import ordering problem
// @TODO: Find solution without import workaround
const messageBox = getConfiguredMessageBox();
const eventStore = getConfiguredEventStore();
const eventBus = getConfiguredEventBus();

const commander = new Command('project');

commander.version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-i, --eventid <EventId>', 'Id of event to project into read model')
  .option('-n, --name <ProjectionName>', `Name of the projection to run (default: ${DEFAULT_READ_MODEL_PROJECTION})`, DEFAULT_READ_MODEL_PROJECTION)
  .parse(process.argv);

const options = commander.opts();

if(options.eventid) {
  (async () => {
    const events = await eventStore.load(WRITE_MODEL_STREAM, {'$eventId': options.eventid})

    for await (const event of events) {
      await eventBus.runProjection(event, options.name);
    }
  })().catch(e => console.error(e));
}
