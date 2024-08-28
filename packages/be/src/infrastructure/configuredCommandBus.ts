import {Command} from "@event-engine/messaging/command";
import {commandHandlers} from "@server/command-handlers/index";
import {commandHandlerExtensions} from "@server/extensions/command-handlers";
import {
  handleAggregateCommand,
  AggregateProcessingFunction,
  AggregateProcessingFunctionWithDeps,
  ProcessingFunction, ProcessingFunctionWithDeps, getStreamId, handleStreamCommand, handlePureCommand
} from "@event-engine/infrastructure/commandHandling";
import {repositories} from "@server/repositories/index";
import {
  AggregateCommandDescription,
  CommandDescription,
  isAggregateCommandDescription, isStreamCommandDescription, PureCommandDescription, StreamCommandDescription
} from "@event-engine/descriptions/descriptions";
import {MessageBus} from "@server/infrastructure/MessageBus";
import {setMessageMetadata} from "@event-engine/messaging/message";
import {
  AggregateRepository,
  META_KEY_DELETE_HISTORY,
  META_KEY_DELETE_STATE
} from "@event-engine/infrastructure/AggregateRepository";
import {ConcurrencyError} from "@event-engine/infrastructure/EventStore/ConcurrencyError";
import {CommandBus} from "@event-engine/messaging/command-bus";
import {StreamEventsRepository} from "@event-engine/infrastructure/StreamEventsRepository";
import {getConfiguredMultiModelStore} from "@server/infrastructure/configuredMultiModelStore";
import {PUBLIC_STREAM, WRITE_MODEL_STREAM} from "@server/infrastructure/configuredEventStore";
import {INFORMATION_SERVICE_NAME} from "@server/infrastructure/information-service/information-service";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {PureFactsRepository} from "@event-engine/infrastructure/PureFactsRepository";

export const SERVICE_NAME_COMMAND_BUS = '$CommandBus';

type PureCommandHandler = ProcessingFunction | ProcessingFunctionWithDeps;
type AggregateCommandHandler = AggregateProcessingFunction | AggregateProcessingFunctionWithDeps;

class LiveCommandBus extends MessageBus implements CommandBus {
  public async dispatch (command: Command, desc: CommandDescription): Promise<boolean> {
    const handler = this.getHandler(desc);
    const dependencies = await this.loadDependencies(command, desc, 'command');

    if(isAggregateCommandDescription(desc)) {
      return this.dispatchAggregateCommand(command, handler as AggregateCommandHandler, desc, dependencies);
    }

    return this.dispatchNonAggregateCommand(command, handler as PureCommandHandler, desc, dependencies);
  }

  private async dispatchAggregateCommand(command: Command, handler: AggregateCommandHandler, desc: AggregateCommandDescription, deps: any): Promise<boolean> {
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
      return await handleAggregateCommand(command, handler, repositories[desc.aggregateName](), desc.newAggregate, deps);
    } catch (e) {
      if(e instanceof ConcurrencyError) {
        // Try again
        return handleAggregateCommand(command, handler, repositories[desc.aggregateName](), desc.newAggregate, deps);
      }

      throw e;
    }
  }

  private async dispatchNonAggregateCommand(command: Command, handler: PureCommandHandler, desc: CommandDescription, deps: any): Promise<boolean> {
    if(isStreamCommandDescription(desc)) {
      return this.dispatchStreamCommand(command, handler, desc, deps);
    } else {
      return this.dispatchPureCommand(command, handler, desc, deps);
    }
  }

  private async dispatchStreamCommand(command: Command, handler: PureCommandHandler, desc: StreamCommandDescription, deps: any): Promise<boolean> {
    const streamId = await getStreamId(desc.streamIdExpr, command, deps);

    const repository = new StreamEventsRepository(
      getConfiguredMultiModelStore(),
      desc.streamName || WRITE_MODEL_STREAM,
      this.loadServiceDependency(INFORMATION_SERVICE_NAME, command, {}),
      getConfiguredMessageBox(),
      desc.publicStream || PUBLIC_STREAM
    );

    try {
      return await handleStreamCommand(command, streamId, handler, repository, deps);
    } catch (e) {
      if(e instanceof ConcurrencyError) {
        // Try again
        return handleStreamCommand(command, streamId, handler, repository, deps);
      }

      throw e;
    }
  }

  private async dispatchPureCommand(command: Command, handler: PureCommandHandler, desc: PureCommandDescription, deps: any): Promise<boolean> {
    const repository = new PureFactsRepository(
      getConfiguredMultiModelStore(),
      desc.streamName || WRITE_MODEL_STREAM,
      this.loadServiceDependency(INFORMATION_SERVICE_NAME, command, {}),
      getConfiguredMessageBox(),
      desc.publicStream || PUBLIC_STREAM
    );

    return handlePureCommand(command, handler, repository, deps);
  }

  private getHandler (desc: CommandDescription): PureCommandHandler | AggregateCommandHandler {
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
