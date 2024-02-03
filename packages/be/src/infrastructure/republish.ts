import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {getConfiguredEventStore, PUBLIC_STREAM, WRITE_MODEL_STREAM} from "@server/infrastructure/configuredEventStore";
import * as process from "process";
import {Command} from "commander";

// Do not remove messageBox, without that import the script fails
// Somehow ts-node is not able to load the event store module correctly
// Doing the message box import first solves the problem
// It seems to be a strange import ordering problem
// @TODO: Find solution without import workaround
const messageBox = getConfiguredMessageBox();
const eventStore = getConfiguredEventStore();

const commander = new Command('republish');

commander.version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-i, --eventid <EventId>', 'Id of event to republish')
  .parse(process.argv);

const options = commander.opts();

if(options.eventid) {
  eventStore.republish(WRITE_MODEL_STREAM, {'$eventId': options.eventid})
    .catch(e => console.error(e));
}

