import {CommandMutationFunction} from "@cody-play/infrastructure/commands/command-mutation-function";
import {PlayCommandRuntimeInfo, PlayEventRegistry, PlaySchemaDefinitions} from "@cody-play/state/types";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {User} from "@app/shared/types/core/user/user";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {Payload} from "@event-engine/messaging/message";
import {AxiosError, AxiosHeaders, AxiosResponse} from "axios";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {
  isAggregateCommandDescription,
  isStreamCommandDescription,
  PureCommandDescription
} from "@event-engine/descriptions/descriptions";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {makePureCommandHandler} from "@cody-play/infrastructure/commands/make-pure-command-handler";
import {playLoadDependencies} from "@cody-play/infrastructure/cody/dependencies/play-load-dependencies";
import {StreamEventsRepository} from "@server/infrastructure/StreamEventsRepository";
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
import {PureFactsRepository} from "@server/infrastructure/PureFactsRepository";
import {
  getStreamId,
  handlePureCommand,
  handleStreamCommand
} from "@server/infrastructure/commandHandling";
import {ValidationError} from "ajv";

export const makePureCommandMutationFn = (
  commandInfo: PlayCommandRuntimeInfo,
  commandHandlerRules: AnyRule[],
  eventRegistry: PlayEventRegistry,
  user: User,
  schemaDefinitions: PlaySchemaDefinitions,
  config: CodyPlayConfig
): CommandMutationFunction => {
  return async (commandPayload: Payload): Promise<AxiosResponse> => {
    const command = (makeCommandFactory(commandInfo, schemaDefinitions))(commandPayload, {user});

    const commandDesc = commandInfo.desc;

    if(isAggregateCommandDescription(commandDesc)) {
      throw new Error('Wrong command handling for given command. This is a bug. ' + CONTACT_PB_TEAM);
    }

    const processingFunction =  makePureCommandHandler(
      commandHandlerRules,
      eventRegistry,
      schemaDefinitions
    );

    const dependencies = await playLoadDependencies(command, 'command', commandDesc.dependencies || {}, config);

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

    try {
      const startTime = new Date();

      const result = isStreamCommandDescription(commandDesc)
        ? await handleStreamCommand(
          command,
          await getStreamId(commandDesc.streamIdExpr, command, dependencies),
          processingFunction,
          repository as StreamEventsRepository,
          dependencies
        )
        : await handlePureCommand(
          command,
          processingFunction,
          repository as PureFactsRepository,
          dependencies
        );


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
