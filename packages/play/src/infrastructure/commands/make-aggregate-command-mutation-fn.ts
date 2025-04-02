import {
  PlayCommandRuntimeInfo,
  PlayEventReducers,
  PlayEventRegistry,
  PlayInformationRuntimeInfo, PlaySchemaDefinitions
} from "@cody-play/state/types";
import {AxiosError, AxiosHeaders, AxiosResponse} from "axios";
import {User} from "@app/shared/types/core/user/user";
import {Payload, setMessageMetadata} from "@event-engine/messaging/message";
import {
  AggregateRepository,
  ApplyFunction, META_KEY_DELETE_HISTORY,
  META_KEY_DELETE_STATE
} from "@server/infrastructure/AggregateRepository";
import {
  AggregateDescription,
  isAggregateCommandDescription
} from "@event-engine/descriptions/descriptions";
import {
  getConfiguredPlayMultiModelStore
} from "@cody-play/infrastructure/multi-model-store/configured-multi-model-store";
import {makeInformationFactory} from "@cody-play/infrastructure/information/make-information-factory";
import {makeEventReducer} from "@cody-play/infrastructure/events/make-event-reducer";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";
import {makeAggregateCommandHandler} from "@cody-play/infrastructure/commands/make-aggregate-command-handler";
import {AnyRule} from "@app/shared/rule-engine/configuration";
import {handleAggregateCommand} from "@server/infrastructure/commandHandling";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {ValidationError} from "ajv";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {playLoadDependencies} from "@cody-play/infrastructure/cody/dependencies/play-load-dependencies";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {
  playInformationServiceFactory
} from "@cody-play/infrastructure/infromation-service/play-information-service-factory";
import {getConfiguredPlayMessageBox} from "@cody-play/infrastructure/message-box/configured-message-box";
import {CommandMutationFunction} from "@cody-play/infrastructure/commands/command-mutation-function";
import {PLAY_WRITE_MODEL_STREAM} from "@cody-play/infrastructure/multi-model-store/configured-event-store";

export const makeAggregateCommandMutationFn = (
  commandInfo: PlayCommandRuntimeInfo,
  commandHandlerRules: AnyRule[],
  aggregateDesc: AggregateDescription,
  eventRegistry: PlayEventRegistry,
  eventReducers: PlayEventReducers,
  stateInfo: PlayInformationRuntimeInfo,
  user: User,
  schemaDefinitions: PlaySchemaDefinitions,
  config: CodyPlayConfig
): CommandMutationFunction => {
  return async (commandPayload: Payload): Promise<AxiosResponse> => {
    let command = (makeCommandFactory(commandInfo, schemaDefinitions))(commandPayload, {user});

    const commandDesc = commandInfo.desc;

    if(!isAggregateCommandDescription(commandDesc)) {
      throw new Error('Wrong command handling for given command. This is a bug. ' + CONTACT_PB_TEAM);
    }

    if(commandDesc.deleteState) {
      command = setMessageMetadata(command, META_KEY_DELETE_STATE, true);
    }

    if(commandDesc.deleteHistory) {
      command = setMessageMetadata(command, META_KEY_DELETE_HISTORY, true);
    }

    const dependencies = await playLoadDependencies(command, 'command', commandDesc.dependencies || {}, config);

    const repository = makeAggregateRepository(
      aggregateDesc,
      eventReducers,
      stateInfo,
      config
    );

    const processingFunction = makeAggregateCommandHandler(
      commandHandlerRules,
      eventRegistry,
      schemaDefinitions,
      aggregateDesc
    );

    try {
      const startTime = new Date();

      const result = await handleAggregateCommand(command, processingFunction, repository, commandDesc.newAggregate, dependencies);

      const endTime = new Date();
      const requestTime: number = (endTime as any) - (startTime as any);

      return {
        data: {success: result},
        status: 200,
        statusText: "OK",
        config: { headers: new AxiosHeaders({}), metadata: {endTime, requestTime}} as any,
        headers: new AxiosHeaders({}),
      }
    } catch (e) {
      console.error(e);

      if(e instanceof ValidationError) {
        throw new AxiosError(e.message + "\n\n" + JSON.stringify(e.errors), '400')
      }

      if(e instanceof Error) {
        throw new AxiosError(e.message)
      } else {
        throw new AxiosError(JSON.stringify(e))
      }
    }
  }
}

export const makeAggregateRepository = (
  aggregateDesc: AggregateDescription,
  eventReducers: PlayEventReducers,
  stateInfo: PlayInformationRuntimeInfo,
  config: CodyPlayConfig
): AggregateRepository => {
  return new AggregateRepository<any>(
    getConfiguredPlayMultiModelStore(),
    aggregateDesc.stream || PLAY_WRITE_MODEL_STREAM,
    aggregateDesc.collection,
    aggregateDesc.name,
    aggregateDesc.identifier,
    makeEventReducers(eventReducers, config),
    makeInformationFactory(stateInfo.factory),
    getConfiguredPlayAuthService(),
    playInformationServiceFactory(),
    getConfiguredPlayMessageBox(config)
  )
}

const makeEventReducers = (eventReducers: PlayEventReducers, config: CodyPlayConfig): {[eventName: string]: ApplyFunction<any>} => {
  const mappedReducers: {[eventName: string]: ApplyFunction<any>} = {};

  for (const eventName in eventReducers) {
    mappedReducers[eventName] = makeEventReducer(eventReducers[eventName], config);
  }

  return mappedReducers;
}
