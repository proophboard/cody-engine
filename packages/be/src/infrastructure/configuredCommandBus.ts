import {Command} from "@event-engine/messaging/command";
import {commandHandlers} from "@server/command-handlers/index";
import {commandHandlerExtensions} from "@app/extensions/be/command-handlers";
import {handle, ProcessingFunction, ProcessingFunctionWithDeps} from "@event-engine/infrastructure/commandHandling";
import {repositories} from "@server/repositories/index";
import {Event} from "@event-engine/messaging/event";
import {
  AggregateCommandDescription,
  CommandDescription,
  isAggregateCommandDescription
} from "@event-engine/descriptions/descriptions";
import {queries} from "@app/shared/queries";
import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";
import {getConfiguredQueryBus} from "@server/infrastructure/configuredQueryBus";
import {services} from "@app/extensions/be/services";

type CommandHandler = ProcessingFunction | ProcessingFunctionWithDeps;

class CommandBus {
  public async dispatch (command: Command, desc: CommandDescription): Promise<boolean> {
    const handler = this.getHandler(desc);
    const dependencies = await this.loadDependencies(command, desc);

    if(isAggregateCommandDescription(desc)) {
      return this.dispatchAggregateCommand(command, handler, desc, dependencies);
    }

    return this.dispatchNonAggregateCommand(command, handler, desc, dependencies);
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

    const {dependencies} = desc;
    const loadedDependencies: Record<string, any> = {};

    if(!dependencies) {
      return loadedDependencies;
    }

    for (const dependencyKey in dependencies) {
      const dep = dependencies[dependencyKey];
      const depName = dep.alias || dependencyKey;

      switch (dep.type) {
        case "query":
          loadedDependencies[depName] = await this.loadQueryDependency(dependencyKey, command, dep.options);
          break;
        case "service":
          loadedDependencies[depName] = this.loadServiceDependency(dependencyKey, command, dep.options);
          break;
        default:
          throw new Error(`Unknown dependency type detected for command "${command.name}". Supported dependency types are: "query", "service". But the configured type is "${dep.type}"`);
      }
    }

    return loadedDependencies;
  }

  private async loadQueryDependency(queryName: string, command: Command, options: any): Promise<any> {
    if(!queries[queryName]) {
      throw new Error(`Query with name "${queryName}" cannot be found, but is configured as a dependency for command "${command.name}"`);
    }

    const queryRuntimeInfo = queries[queryName];
    const keyMapping = options?.mapping || {};

    const query = queryRuntimeInfo.factory(determineQueryPayload(command.payload, queryRuntimeInfo, keyMapping), command.meta);

    return await getConfiguredQueryBus().dispatch(query, queryRuntimeInfo.desc);
  }

  private loadServiceDependency(serviceName: string, command: Command, options?: any): any {
    if(!services[serviceName]) {
      throw new Error(`Service factory for service with name "${serviceName}" not found in @extensions/be/services registry. The service is configured as dependency for command "${command.name}".`);
    }

    const serviceFactory = services[serviceName];

    if(typeof serviceFactory !== "function") {
      throw new Error(`Service factory for service with name "${serviceName}" is not a function. Please check registry in @extensions/be/services. The service is configured as dependency for command "${command.name}".`);
    }

    return serviceFactory(options);
  }
}

let commandBus: CommandBus;

export const getConfiguredCommandBus = (): CommandBus => {
  if(!commandBus) {
    commandBus = new CommandBus();
  }

  return commandBus;
}
