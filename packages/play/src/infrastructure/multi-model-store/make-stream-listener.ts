import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {EventQueue} from "@event-engine/infrastructure/EventQueue";
import {InMemoryStreamListenerQueue} from "@event-engine/infrastructure/Queue/InMemoryStreamListenerQueue";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {setMessageMetadata} from "@event-engine/messaging/message";
import {META_KEY_DELETE_HISTORY, META_KEY_DELETE_STATE} from "@event-engine/infrastructure/AggregateRepository";
import {makeCommandHandler} from "@cody-play/infrastructure/commands/make-command-handler";
import {makeAggregateRepository} from "@cody-play/infrastructure/commands/make-command-mutation-fn";
import {handle} from "@event-engine/infrastructure/commandHandling";
import {Command} from "@event-engine/messaging/command";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";

export class PlayStreamListener {
  private readonly queue: EventQueue;
  private config: CodyPlayConfig;

  public constructor(es: InMemoryEventStore, stream: string, config: CodyPlayConfig) {
    this.queue = new InMemoryStreamListenerQueue(es, stream);

    this.config = config;

    this.queue.attachConsumer(async (event) => {

      console.log(`[PlayStreamListener] Going to handle event: ${event.name}`);

      const policies = this.config.eventPolicies[event.name] || {};

      const policyNames = Object.keys(policies);

      if(policyNames.length === 0) {
        console.log(`[PlayStreamListener] No event policies registered for event: ${event.name}`);
      } else {
        console.log(`[PlayStreamListener] Following event policies are registered for event "${event.name}": ${policyNames.join(", ")}`);
      }

      let allSuccess = true;
      for (const policy of Object.values(policies)) {
        console.log(`[PlayStreamListener] Going to execute policy rules of "${policy.name}"`)
        try {
          // @TODO load dependencies
          const ctx = {event: event.payload, meta: event.meta, commandRegistry: config.commands, schemaDefinitions: config.definitions};
          const exe = makeAsyncExecutable(policy.rules);
          const result = await exe(ctx);

          console.log("result", result);

          if(result['commands']) {
            for (const command of result['commands']) {
              console.log(`[PlayStreamListener] Dispatching command "${command.name}" triggered by policy "${policy.name}"`);
              await dispatchCommand(command, this.config);
            }
          }
        } catch (e) {
          console.error(e);
          allSuccess = false;
        }
      }

      return allSuccess;
    })
  }

  public updateConfig(newConfig: CodyPlayConfig): void {
    this.config = newConfig;
  }

  public startProcessing(): void {
    this.queue.startProcessing();
  }

  public stopProcessing(): void {
    this.queue.pause();
  }
}

export const makeStreamListener = (es: InMemoryEventStore, stream: string, config: CodyPlayConfig): PlayStreamListener => {
  return new PlayStreamListener(es, stream, config);
}

const dispatchCommand = async (command: Command, config: CodyPlayConfig): Promise<boolean> => {
  const commandInfo = config.commands[command.name];

  if(!commandInfo) {
    throw new Error(`Cannot dispatch command "${command.name}". Command is unknown.`);
  }

  const rules = config.commandHandlers[command.name];

  if(!rules) {
    throw new Error(`Cannot handle command "${command.name}". No business rules defined. Please connect the command to an aggregate and define business rules in the Cody Wizard`);
  }

  const commandDesc = commandInfo.desc;

  if(!isAggregateCommandDescription(commandDesc)) {
    throw new Error(`Cannot handle command "${command.name}". Please connect the command to an aggregate and define business rules in the Cody Wizard`);
  }

  const aggregate = config.aggregates[commandDesc.aggregateName];

  if(!aggregate) {
    throw new Error(`Cannot handle command "${command.name}". Aggregate "${commandDesc.aggregateName}" is unknown.`);
  }

  const aggregateEventReducers = config.eventReducers[commandDesc.aggregateName];

  if(!aggregateEventReducers) {
    throw new Error(`Cannot handle command "${command.name}". No event reducers found. Please connect the command to an aggregate with at least one event. Use the Cody Wizard to define reducer rules for events.`);
  }

  const stateInfo = config.types[aggregate.state];

  if(!stateInfo) {
    throw new Error(`Cannot handle command "${command.name}". The resulting Information "${aggregate.state}" is unknown. Please run Cody with the corresponding information card to register it.`);
  }

  if(commandDesc.deleteState) {
    command = setMessageMetadata(command, META_KEY_DELETE_STATE, true);
  }

  if(commandDesc.deleteHistory) {
    command = setMessageMetadata(command, META_KEY_DELETE_HISTORY, true);
  }

  // @TODO: load dependencies
  const dependencies = {};

  const repository = makeAggregateRepository(
    aggregate,
    aggregateEventReducers,
    stateInfo
  );

  const processingFunction = makeCommandHandler(
    rules,
    config.events,
    config.definitions
  );

  return handle(command, processingFunction, repository, commandDesc.newAggregate, dependencies);
}
