import {CommandMutationFunction} from "@cody-play/infrastructure/commands/command-mutation-function";
import {PlayCommandRuntimeInfo, PlayEventRegistry, PlaySchemaDefinitions} from "@cody-play/state/types";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {User} from "@app/shared/types/core/user/user";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {Payload} from "@event-engine/messaging/message";
import {AxiosResponse} from "axios";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {isAggregateCommandDescription} from "@event-engine/descriptions/descriptions";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {makeCommandHandler} from "@cody-play/infrastructure/commands/make-command-handler";

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

    const processingFunction = makeCommandHandler(
      commandHandlerRules,
      eventRegistry,
      schemaDefinitions
    );


  }
}
