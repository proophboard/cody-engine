import {MessageBox} from "@event-engine/messaging/message-box";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {CommandBus} from "@event-engine/messaging/command-bus";
import {EventBus} from "@event-engine/messaging/event-bus";
import {QueryBus} from "@event-engine/messaging/query-bus";
import {Command, CommandRuntimeInfo} from "@event-engine/messaging/command";
import {Event, EventRuntimeInfo} from "@event-engine/messaging/event";
import {Query, QueryRuntimeInfo} from "@event-engine/messaging/query";
import {
  CommandDescription,
  isAggregateCommandDescription, isStreamCommandDescription, PureCommandDescription,
  QueryDescription
} from "@event-engine/descriptions/descriptions";
import {Meta, Payload, setMessageMetadata} from "@event-engine/messaging/message";
import {META_KEY_DELETE_HISTORY, META_KEY_DELETE_STATE} from "@event-engine/infrastructure/AggregateRepository";
import {playLoadDependencies} from "@cody-play/infrastructure/cody/dependencies/play-load-dependencies";
import {makeAggregateRepository} from "@cody-play/infrastructure/commands/make-aggregate-command-mutation-fn";
import {makeAggregateCommandHandler} from "@cody-play/infrastructure/commands/make-aggregate-command-handler";
import {
  getStreamId,
  handleAggregateCommand,
  handlePureCommand,
  handleStreamCommand
} from "@event-engine/infrastructure/commandHandling";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {PlayEventPolicyDescription, PlayEventPolicyRegistry} from "@cody-play/state/types";
import {makeLocalApiQuery} from "@cody-play/queries/local-api-query";
import {User} from "@app/shared/types/core/user/user";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {makeEventFactory} from "@cody-play/infrastructure/events/make-event-factory";
import {makeQueryFactory} from "@cody-play/queries/make-query-factory";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {StreamEventsRepository} from "@event-engine/infrastructure/StreamEventsRepository";
import {
  getConfiguredPlayMultiModelStore
} from "@cody-play/infrastructure/multi-model-store/configured-multi-model-store";
import {
  PLAY_PUBLIC_STREAM,
  PLAY_WRITE_MODEL_STREAM
} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {
  playInformationServiceFactory
} from "@cody-play/infrastructure/infromation-service/play-information-service-factory";
import {getConfiguredPlayMessageBox} from "@cody-play/infrastructure/message-box/configured-message-box";
import {PureFactsRepository} from "@event-engine/infrastructure/PureFactsRepository";
import {makePureCommandHandler} from "@cody-play/infrastructure/commands/make-pure-command-handler";
import {AuthService} from "@event-engine/infrastructure/auth-service/auth-service";
import {mapMetadataFromEventStore} from "@event-engine/infrastructure/EventStore/map-metadata-from-event-store";
import {ValidationError} from "ajv";

export class PlayMessageBox implements MessageBox {
  private config: CodyPlayConfig;

  public commandBus: CommandBus;
  public eventBus: EventBus;
  public queryBus: QueryBus;
  public authService: AuthService;

  public constructor(config: CodyPlayConfig, authService: AuthService) {
    this.config = config;
    this.authService = authService;

    this.commandBus = { dispatch: async (command: Command, desc: CommandDescription): Promise<boolean> => {
      return await dispatchCommand(command, this.config);
    }};

    this.eventBus = {
      on: async (event: Event, triggerLiveProjections?: boolean): Promise<boolean> => {
        event = (await mapMetadataFromEventStore([event], this.authService))[0];
        return await dispatchEvent(event, this.config, triggerLiveProjections);
      }
    }

    this.queryBus = {
      dispatch: async <S extends Payload = any>(query: Query, desc: QueryDescription): Promise<S> => {
        return makeLocalApiQuery(this.config, query.meta.user as User)(query.name, query.payload);
      }
    }
  }

  public updateConfig(config: CodyPlayConfig, authService: AuthService) {
    this.config = config;
    this.authService = authService;
  }

  public async dispatch(messageName: string, payload: Payload, meta?: Meta): Promise<any> {
    if(this.isCommand(messageName)) {
      const commandFactory = makeCommandFactory(this.config.commands[messageName], this.config.definitions);
      return await this.commandBus.dispatch(commandFactory(payload, meta), this.config.commands[messageName].desc);
    }

    if(this.isEvent(messageName)) {
      const eventFactory = makeEventFactory(this.config.events[messageName], this.config.definitions);
      return await this.eventBus.on(eventFactory(payload, meta));
    }

    if(this.isQuery(messageName)) {
      const queryFactory = makeQueryFactory(this.config.queries[messageName], this.config.definitions);
      return await this.queryBus.dispatch(queryFactory(payload, meta), this.config.queries[messageName].desc);
    }
  }

  getCommandInfo(name: string): CommandRuntimeInfo {
    if(!this.isCommand(name)) {
      throw new Error(`Unknown command "${name}" given. Cannot find a description for it.`);
    }

    return this.config.commands[name] as unknown as CommandRuntimeInfo;
  }

  getEventInfo(name: string): EventRuntimeInfo {
    if(!this.isEvent(name)) {
      throw new Error(`Unknown event "${name}" given. Cannot find a description for it.`);
    }

    return this.config.events[name] as unknown as EventRuntimeInfo;
  }

  getQueryInfo(name: string): QueryRuntimeInfo {
    if(!this.isQuery(name)) {
      throw new Error(`Unknown query "${name}" given. Cannot find a description for it.`);
    }

    return this.config.queries[name] as unknown as QueryRuntimeInfo;
  }

  isCommand(name: string): boolean {
    return typeof this.config.commands[name] !== 'undefined';
  }

  isEvent(name: string): boolean {
    return typeof this.config.events[name] !== 'undefined';
  }

  isQuery(name: string): boolean {
    return typeof this.config.queries[name] !== 'undefined';
  }
}

const dispatchEvent = async (event: Event, config: CodyPlayConfig, triggerLiveProjections?: boolean): Promise<boolean> => {
  console.log(`[EventBus] Going to handle event: ${event.name}`);

  const policies = config.eventPolicies[event.name] || {};
  const filteredPolicies: {[policyName: string]: PlayEventPolicyDescription} = {};

  for (const policyName in policies) {
    const desc = policies[policyName];

    if(!!desc.live === !!triggerLiveProjections) {
      filteredPolicies[policyName] = desc;
    }
  }

  const policyNames = Object.keys(filteredPolicies);

  if(policyNames.length === 0) {
    console.log(`[EventBus] No ${triggerLiveProjections? 'live projections' : 'event policies'} registered for event: ${event.name}`);
  } else {
    console.log(`[EventBus] Following ${triggerLiveProjections? 'live projections' : 'event policies'} are registered for event "${event.name}": ${policyNames.join(", ")}`);
  }

  let allSuccess = true;
  for (const policy of Object.values(filteredPolicies)) {
    console.log(`[EventBus] Going to execute policy rules of "${policy.name}"`)
    try {
      const dependencies = await playLoadDependencies(event, 'event', policy.dependencies || {}, config);

      const ctx = {event: event.payload, meta: event.meta, eventCreatedAt: event.createdAt, ...dependencies, commandRegistry: config.commands, schemaDefinitions: config.definitions};
      const exe = makeAsyncExecutable(policy.rules);
      const result = await exe(ctx);

      if(result['commands']) {
        for (const command of result['commands']) {
          console.log(`[EventBus] Dispatching command "${command.name}" triggered by policy "${policy.name}"`);
          await dispatchCommand(command, config);
        }
      }
    } catch (e) {
      console.error(e);
      if(e instanceof ValidationError) {
        console.error(JSON.stringify(e.errors, null, 2));
      }
      allSuccess = false;
    }
  }

  return allSuccess;
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
    return dispatchPureCommand(command, commandDesc, rules, config);
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

  const dependencies = await playLoadDependencies(command, 'command', commandDesc.dependencies || {}, config);

  const repository = makeAggregateRepository(
    aggregate,
    aggregateEventReducers,
    stateInfo,
    config
  );

  const processingFunction = makeAggregateCommandHandler(
    rules,
    config.events,
    config.definitions
  );

  return handleAggregateCommand(command, processingFunction, repository, commandDesc.newAggregate, dependencies);
}

const dispatchPureCommand = async (command: Command, commandDesc: PureCommandDescription, rules: AnyRule[], config: CodyPlayConfig): Promise<boolean> => {
  const dependencies = await playLoadDependencies(command, 'command', commandDesc.dependencies || {}, config);

  const processingFunction =  makePureCommandHandler(
    rules,
    config.events,
    config.definitions
  );

  const repository = isStreamCommandDescription(commandDesc)
    ? new StreamEventsRepository(
      getConfiguredPlayMultiModelStore(),
      commandDesc.streamName || PLAY_WRITE_MODEL_STREAM,
      playInformationServiceFactory(),
      getConfiguredPlayMessageBox(config),
      commandDesc.publicStream || PLAY_PUBLIC_STREAM
    )
    : new PureFactsRepository(
      getConfiguredPlayMultiModelStore(),
      (commandDesc as PureCommandDescription).streamName || PLAY_WRITE_MODEL_STREAM,
      playInformationServiceFactory(),
      getConfiguredPlayMessageBox(config),
      (commandDesc as PureCommandDescription).publicStream || PLAY_PUBLIC_STREAM
    );

  return isStreamCommandDescription(commandDesc)
    ? handleStreamCommand(
      command,
      await getStreamId(commandDesc.streamIdExpr, command, dependencies),
      processingFunction,
      repository as StreamEventsRepository,
      dependencies
    )
    : handlePureCommand(
      command,
      processingFunction,
      repository as PureFactsRepository,
      dependencies
    );
}
