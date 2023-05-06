import {Command} from "@event-engine/messaging/command";
import {commandHandlers} from "@server/command-handlers/index";
import {commandHandlerExtensions} from "@app/extensions/command-handlers";
import {handle, ProcessingFunction, ProcessingFunctionWithDeps} from "@event-engine/infrastructure/commandHandling";
import {repositories} from "@server/repositories/index";
import {Event} from "@event-engine/messaging/event";
import {
  AggregateCommandDescription,
  CommandDescription,
  isAggregateCommandDescription
} from "@event-engine/descriptions/descriptions";

type CommandHandler = ProcessingFunction | ProcessingFunctionWithDeps;

class CommandBus {
  public async dispatch (command: Command, desc: CommandDescription): Promise<boolean> {
    // @TODO: check deps config and load deps
    const handler = this.getHandler(desc);

    if(isAggregateCommandDescription(desc)) {
      return this.dispatchAggregateCommand(command, handler, desc, {});
    }

    return this.dispatchNonAggregateCommand(command, handler, desc, {});
  }

  private async dispatchAggregateCommand(command: Command, handler: CommandHandler, desc: AggregateCommandDescription, deps: any): Promise<boolean> {
    if(!repositories[desc.aggregateName]) {
      throw new Error(`Cannot handle command "${command.name}". The repository for aggregate "${desc.aggregateName}" is not registered.`);
    }

    return handle(command, handler, repositories[desc.aggregateName], desc.newAggregate, deps);
  }

  private async dispatchNonAggregateCommand(command: Command, handler: CommandHandler, desc: CommandDescription, deps: any): Promise<boolean> {
    let result: IteratorResult<Event, Event>;
    const processing = handler({}, command, deps);
    const events: Event[] = [];
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

  private async loadDependencies(command: Command, desc: CommandDescription): Promise<any> {
    // @TODO: Implement dependency loading
    return {};
  }
}

let commandBus;

export const getConfiguredCommandBus = (): CommandBus => {
  if(!commandBus) {
    commandBus = new CommandBus();
  }

  return commandBus;
}
