import {CommandBus} from "@event-engine/messaging/command-bus";
import {EventBus} from "@event-engine/messaging/event-bus";
import {QueryBus} from "@event-engine/messaging/query-bus";
import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {EventRuntimeInfo} from "@event-engine/messaging/event";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {Meta, Payload} from "@event-engine/messaging/message";

export interface MessageBox {
  commandBus: CommandBus;
  eventBus: EventBus;
  queryBus: QueryBus;
  dispatch: (messageName: string, payload: Payload, meta?: Meta) => Promise<any>;
  isCommand: (name: string) => boolean;
  isEvent: (name: string) => boolean
  isQuery: (name: string) => boolean;
  getCommandInfo: (name: string) => CommandRuntimeInfo;
  getEventInfo: (name: string) => EventRuntimeInfo;
  getQueryInfo: (name: string) => QueryRuntimeInfo
}
