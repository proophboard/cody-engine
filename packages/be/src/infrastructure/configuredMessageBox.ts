import {commands} from "@app/shared/commands";
import {events} from "@app/shared/events";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {EventRuntimeInfo} from "@event-engine/messaging/event";
import {queries} from "@app/shared/queries";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";

class MessageBox {
  public isCommand (name: string): boolean {
    return typeof commands[name] !== undefined;
  }

  public isEvent (name: string): boolean {
    return typeof events[name] !== undefined;
  }

  public isQuery (name: string): boolean {
    return typeof queries[name] !== undefined;
  }

  public getCommandInfo(name: string): CommandRuntimeInfo {
    if(!this.isCommand(name)) {
      throw new Error(`Unknown command "${name}" given. Cannot find a description for it.`);
    }

    return commands[name];
  }

  public getEventInfo(name: string): EventRuntimeInfo {
    if(!this.isEvent(name)) {
      throw new Error(`Unknown event "${name}" given. Cannot find a description for it.`);
    }

    return events[name];
  }

  public getQueryInfo(name: string): QueryRuntimeInfo {
    if(!this.isQuery(name)) {
      throw new Error(`Unknown query "${name}" given. Cannot find a description for it.`);
    }

    return queries[name];
  }
}

let messageBox: MessageBox;

export const getConfiguredMessageBox = (): MessageBox => {
  if(!messageBox) {
    messageBox = new MessageBox();
  }

  return messageBox;
}
