import {commandHandlers} from "@server/command-handlers/index";
import {makePureCommandHandler} from "@cody-play/package/infrastructure/commands/make-pure-command-handler";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {playshot} from "@server/playconfig/playshot";
import {repositories} from "@server/repositories/index";
import {AggregateRepository, ApplyFunction} from "@server/infrastructure/AggregateRepository";
import {getConfiguredMultiModelStore} from "@server/infrastructure/configuredMultiModelStore";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {getExternalServiceOrThrow} from "@server/extensions/get-external-service";
import {AuthService, SERVICE_NAME_AUTH_SERVICE} from "@event-engine/infrastructure/auth-service/auth-service";
import {
  INFORMATION_SERVICE_NAME,
  InformationService
} from "@event-engine/infrastructure/information-service/information-service";
import {WRITE_MODEL_STREAM} from "@server/infrastructure/configuredEventStore";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import {makeAggregateCommandHandler} from "@cody-play/infrastructure/commands/make-aggregate-command-handler";
import {commands} from "@app/shared/commands";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {PlayEventReducers, PlaySchemaDefinitions} from "@cody-play/state/types";
import {makeEventReducer} from "@cody-play/infrastructure/events/make-event-reducer";
import {events} from "@app/shared/events";
import {makeEventFactory} from "@cody-play/infrastructure/events/make-event-factory";
import {queries} from "@app/shared/queries";
import {makeQueryFactory} from "@cody-play/queries/make-query-factory";
import {queryResolvers} from "@server/query-resolvers/index";
import {makeQueryResolver} from "@server/playconfig/utils/make-query-resolver";
import definitions from "@app/shared/types/definitions";
import {policies} from "@server/policies/index";
import {makePolicy} from "@server/playconfig/utils/make-policy";
import {types} from "@app/shared/types";
import {services} from "@server/extensions/services";
import {makePlayRulesServiceFactory} from "@cody-play/infrastructure/services/make-play-rules-service-factory";
import {informationServiceFactory} from "@server/infrastructure/information-service/information-service-factory";
import {names} from "@event-engine/messaging/helpers";
import { Personas } from '@app/shared/extensions/personas';
import { DevLogger } from '@frontend/util/Logger';

export const bootstrapPlayBackend = () => {
  registerTypes();
  registerCommands();
  bootstrapCommandHandlers();
  registerEvents();
  bootstrapPolicies();
  registerQueries();
  bootstrapQueryResolvers();
  bootstrapServices();
  registerPersonas();
}

const playDefinitionIdFromFQCN = (fqcn: string): string => {
  return '/definitions/' + fqcn
    .split(".")
    .map(r => names(r).fileName)
    .join("/");
}

const registerTypes = () => {
  for (const typeName in playshot.types) {
    const information = playshot.types[typeName];

    if(types[typeName]) {
      console.log(`Skipping play type "${typeName}". A custom type is configured.`);
      continue;
    }

    types[typeName] = {
      desc: information.desc,
      schema: information.schema,
      uiSchema: information.uiSchema,
      factory: makeInformationFactory(information.factory)
    };

    (definitions as any)[playDefinitionIdFromFQCN(typeName)] = information.schema;

    console.log(`Registered play type "${typeName}".`);
  }
}

const registerCommands = () => {
  for (const commandName in playshot.commands) {
    if(commands[commandName]) {
      console.log(`Skipping play command "${commandName}". A custom command is configured.`)
      continue;
    }

    const command = playshot.commands[commandName];

    commands[commandName] = {
      desc: command.desc,
      schema: command.schema,
      uiSchema: command.uiSchema,
      factory: makeCommandFactory(command, definitions as unknown as PlaySchemaDefinitions)
    }

    console.log(`Registered play command "${commandName}".`)
  }
}

const registerEvents = () => {
  for (const eventName in playshot.events) {
    if(events[eventName]) {
      console.log(`Skipping play event "${eventName}". A custom event is configured.`)
      continue;
    }

    const event = playshot.events[eventName];

    events[eventName] = {
      desc: event.desc,
      schema: event.schema,
      factory: makeEventFactory(event, definitions as unknown as PlaySchemaDefinitions)
    }

    console.log(`Registered play event "${eventName}".`)
  }
}

const registerQueries = () => {
  for (const queryName in playshot.queries) {
    if(queries[queryName]) {
      console.log(`Skipping play query "${queryName}". A custom query is configured.`)
      continue;
    }

    const query = playshot.queries[queryName];

    queries[queryName] = {
      desc: query.desc,
      schema: query.schema,
      factory: makeQueryFactory(query, definitions as unknown as PlaySchemaDefinitions)
    }

    console.log(`Registered play query "${queryName}".`)
  }
}

const bootstrapCommandHandlers = () => {
  const messageBox = getConfiguredMessageBox();
  const store = getConfiguredMultiModelStore();
  const authService = getExternalServiceOrThrow<AuthService>(SERVICE_NAME_AUTH_SERVICE, {});
  const informationService = getExternalServiceOrThrow<InformationService>(INFORMATION_SERVICE_NAME, {});

  for (const commandName in playshot.commandHandlers) {
    const command = playshot.commands[commandName];

    if(!command) {
      console.warn(`Skipping play command handler. Command "${commandName}" cannot not be found in the playshot.`);
      continue;
    }

    if(commandHandlers[commandName]) {
      console.log(`Skipping play command handler for command "${commandName}". A custom handler is configured.`);
      continue;
    }

    if(isAggregateCommandDescription(command.desc) && playshot.aggregates[command.desc.aggregateName]) {
      const aggregate = playshot.aggregates[command.desc.aggregateName];

      if(repositories[command.desc.aggregateName]) {
        console.log(`Skipping play repository for aggregate "${command.desc.aggregateName}". A custom repository is configured.`)
      } else {
        const arState = playshot.types[aggregate.state];

        if(!arState) {
          throw new Error(`Cannot set up play aggregate handling for aggregate ${aggregate.name}, the aggregate state "${aggregate.state}" cannot be found in the types registry.`);
        }

        repositories[command.desc.aggregateName] = (): AggregateRepository<any> => {
          return new AggregateRepository<any>(
            store,
            aggregate.stream || WRITE_MODEL_STREAM,
            aggregate.collection,
            aggregate.name,
            aggregate.identifier,
            makeEventReducers(playshot.eventReducers[aggregate.name] || [], playshot as CodyPlayConfig),
            makeInformationFactory(arState.factory),
            authService,
            informationService,
            messageBox
          )
        }

        console.log(`Registered play aggregate repository for: ${command.desc.aggregateName}.`);
      }

      console.log(`Registered play aggregate command handler for: ${commandName}.`);

      commandHandlers[commandName] = makeAggregateCommandHandler(
        playshot.commandHandlers[commandName],
        playshot.events,
        definitions as unknown as PlaySchemaDefinitions,
        aggregate,
        false
      )

    } else {
      console.log(`Registered play pure command handler for: ${commandName}.`);

      commandHandlers[commandName] = makePureCommandHandler(
        playshot.commandHandlers[commandName],
        playshot.events,
        definitions as unknown as PlaySchemaDefinitions,
        command.desc,
        false
      )
    }
  }
}

const makeEventReducers = (eventReducers: PlayEventReducers, config: CodyPlayConfig): {[eventName: string]: ApplyFunction<any>} => {
  const mappedReducers: {[eventName: string]: ApplyFunction<any>} = {};

  for (const eventName in eventReducers) {
    mappedReducers[eventName] = makeEventReducer(eventReducers[eventName], config);
  }

  return mappedReducers;
}

const bootstrapPolicies = () => {
  for (const eventName in playshot.eventPolicies) {
    for (let policyName in playshot.eventPolicies[eventName]) {
      const policy = playshot.eventPolicies[eventName][policyName];

      if(!policyName.includes('.')) {
        policyName = `${playshot.defaultService}.${policyName}`
      }

      if(!policies[eventName]) {
        policies[eventName] = {}
      }

      if(policies[eventName][policyName]) {
        console.log(`Skipping play policy "${policyName}" for event "${eventName}". A custom policy is configured.`);
        continue;
      }

      policies[eventName][policyName] = {
        policy: makePolicy(policy, playshot),
        desc: policy
      }

      console.log(`Registered play policy "${policyName}" for event "${eventName}".`)
    }
  }
}

const bootstrapQueryResolvers = () => {
  for (const queryName in playshot.resolvers) {
    const query = playshot.queries[queryName];

    if(!query) {
      console.warn(`Skipping play resolver for query "${queryName}". Query cannot be found in the playshot.`)
    }

    const information = playshot.types[query.desc.returnType];

    if(!information) {
      console.warn(`Skipping play resolver for query "${queryName}". Query return type "${query.desc.returnType}" cannot be found in the playshot types.`);
    }

    if(queryResolvers[queryName]) {
      console.log(`Skipping play query resolver for "${queryName}". A custom resolver is configured.`);
      continue;
    }

    const resolveConfig = playshot.resolvers[queryName];

    queryResolvers[queryName] = makeQueryResolver(query, resolveConfig, information, playshot);

    console.log(`Registered play query resolver for: ${queryName}.`);
  }
}

const bootstrapServices = () => {
  for (const serviceName in playshot.services) {
    if(services[serviceName]) {
      console.log(`Skipping play service "${serviceName}". A custom service is configured.`);
      continue;
    }

    services[serviceName] = makePlayRulesServiceFactory(serviceName, playshot.services[serviceName], informationServiceFactory);

    console.log(`Registered play service "${serviceName}".`);
  }
}

const registerPersonas = () => {
  // Remove Anyone persona
  Personas.shift();

  // Preserve user defined personas
  Personas.reverse();

  playshot.personas.forEach(p => {
    Personas.unshift(p);

    DevLogger.log(`[CodyPlay] Registered play persona "${p.displayName}".`);
  });

  Personas.reverse();
}

