import {Command} from "@event-engine/messaging/command";
import {commandHandlers} from "@server/command-handlers/index";
import {commandHandlerExtensions} from "@server/extensions/command-handlers";
import {handle, ProcessingFunction, ProcessingFunctionWithDeps} from "@event-engine/infrastructure/commandHandling";
import {repositories} from "@server/repositories/index";
import {Event} from "@event-engine/messaging/event";
import {
  AggregateCommandDescription,
  CommandDescription,
  isAggregateCommandDescription
} from "@event-engine/descriptions/descriptions";
import {MessageBus} from "@server/infrastructure/MessageBus";
import {setMessageMetadata} from "@event-engine/messaging/message";
import {META_KEY_DELETE_HISTORY, META_KEY_DELETE_STATE} from "@event-engine/infrastructure/AggregateRepository";
import {ConcurrencyError} from "@event-engine/infrastructure/EventStore/ConcurrencyError";
import {CommandBus} from "@event-engine/messaging/command-bus";

export const SERVICE_NAME_COMMAND_BUS = '$CommandBus';

type CommandHandler = ProcessingFunction | ProcessingFunctionWithDeps;

class LiveCommandBus extends MessageBus implements CommandBus {
  public async dispatch (command: Command, desc: CommandDescription): Promise<boolean> {
    const handler = this.getHandler(desc);
    const dependencies = await this.loadDependencies(command, desc, 'command');

    if(isAggregateCommandDescription(desc)) {
      return this.dispatchAggregateCommand(command, handler, desc, dependencies);
    }

    return this.dispatchNonAggregateCommand(command, handler, desc, dependencies);
  }

  private async dispatchAggregateCommand(command: Command, handler: CommandHandler, desc: AggregateCommandDescription, deps: any): Promise<boolean> {
    if(!repositories[desc.aggregateName]) {
      throw new Error(`Cannot handle command "${command.name}". The repository for aggregate "${desc.aggregateName}" is not registered.`);
    }

    if(desc.deleteState) {
      command = setMessageMetadata(command, META_KEY_DELETE_STATE, true);
    }

    if(desc.deleteHistory) {
      command = setMessageMetadata(command, META_KEY_DELETE_HISTORY, true);
    }

    try {
      return await handle(command, handler, repositories[desc.aggregateName](), desc.newAggregate, deps);
    } catch (e) {
      if(e instanceof ConcurrencyError) {
        // Try again
        return handle(command, handler, repositories[desc.aggregateName](), desc.newAggregate, deps);
      }

      throw e;
    }
  }

  private async dispatchNonAggregateCommand(command: Command, handler: CommandHandler, desc: CommandDescription, deps: any): Promise<boolean> {
    let result: IteratorResult<Event, Event>;
    const processing = handler({}, command, deps);
    const events: Event[] = [];
    // eslint-disable-next-line no-cond-assign
    while(result = await processing.next()) {
      if(!result.value) {
        break;
      }

      events.push(result.value);
    }

    // @TODO: dispatch events

    return true;
  }

  private getHandler (desc: CommandDescription): CommandHandler {
    if(commandHandlerExtensions[desc.name]) {
      return commandHandlerExtensions[desc.name];
    }

    if(!commandHandlers[desc.name]) {
      throw new Error(`No command handler found for command "${desc.name}"`);
    }

    return commandHandlers[desc.name];
  }


}

let commandBus: LiveCommandBus;

export const getConfiguredCommandBus = (): LiveCommandBus => {
  if(!commandBus) {
    commandBus = new LiveCommandBus();
  }

  return commandBus;
}
