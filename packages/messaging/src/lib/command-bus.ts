import {Command} from "@event-engine/messaging/command";
import {CommandDescription} from "@event-engine/descriptions/descriptions";

export interface CommandBus {
  dispatch: (command: Command, desc: CommandDescription) => Promise<boolean>;
}
