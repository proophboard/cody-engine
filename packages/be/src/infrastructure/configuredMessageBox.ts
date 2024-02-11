import {commands} from "@app/shared/commands";
import {events} from "@app/shared/events";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {EventRuntimeInfo} from "@event-engine/messaging/event";
import {queries} from "@app/shared/queries";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {getExternalService} from "@server/extensions/get-external-service";
import {getConfiguredCommandBus, SERVICE_NAME_COMMAND_BUS} from "@server/infrastructure/configuredCommandBus";
import {getConfiguredQueryBus, SERVICE_NAME_QUERY_BUS} from "@server/infrastructure/configuredQueryBus";
import {getConfiguredEventBus, SERVICE_NAME_EVENT_BUS} from "@server/infrastructure/configuredEventBus";
import {Meta, Payload} from "@event-engine/messaging/message";
import {CommandBus} from "@event-engine/messaging/command-bus";
import {EventBus} from "@event-engine/messaging/event-bus";
import {QueryBus} from "@event-engine/messaging/query-bus";
import {MessageBox} from "@event-engine/messaging/message-box";

class InternalMessageBox implements MessageBox{

  public commandBus: CommandBus;
  public eventBus: EventBus;
  public queryBus: QueryBus;


  constructor() {
    this.commandBus = getExternalService<CommandBus>(SERVICE_NAME_COMMAND_BUS, {}) || getConfiguredCommandBus();
    this.queryBus = getExternalService<QueryBus>(SERVICE_NAME_QUERY_BUS, {}) || getConfiguredQueryBus();
    this.eventBus = getExternalService<EventBus>(SERVICE_NAME_EVENT_BUS, {}) || getConfiguredEventBus();
  }

  public async dispatch(messageName: string, payload: Payload, meta?: Meta): Promise<any> {
    if(this.isCommand(messageName)) {
      const cmdInfo = this.getCommandInfo(messageName);

      return this.commandBus.dispatch(cmdInfo.factory(payload, meta), cmdInfo.desc);
    }

    if(this.isEvent(messageName)) {
      const eventInfo = this.getEventInfo(messageName);

      return this.eventBus.on(eventInfo.factory(payload, meta));
    }

    if(this.isQuery(messageName)) {
      const queryInfo = this.getQueryInfo(messageName);

      return this.queryBus.dispatch(queryInfo.factory(payload, meta), queryInfo.desc);
    }

    throw new Error(`Unknown message received: "${messageName}"`);
  }

  public isCommand (name: string): boolean {
    return typeof commands[name] !== 'undefined';
  }

  public isEvent (name: string): boolean {
    return typeof events[name] !== 'undefined';
  }

  public isQuery (name: string): boolean {
    return typeof queries[name] !== 'undefined';
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
    messageBox = new InternalMessageBox();
  }

  return messageBox;
}
