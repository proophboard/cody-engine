import {Policy} from "@event-engine/infrastructure/PolicyRegistry";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {Event} from "@event-engine/messaging/event";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {BePlayConfig} from "@server/playconfig/be-play-config";
import {PlayEventPolicyDescription} from "@cody-play/state/types";
import definitions from "@app/shared/types/definitions";

const messageBox = getConfiguredMessageBox();

export const makePolicy = (policy: PlayEventPolicyDescription, playConfig: BePlayConfig): Policy => {
    return async (event: Event, deps: any): Promise<void> => {
      const ctx = {event: event.payload, meta: event.meta, eventCreatedAt: event.createdAt, ...deps, commandRegistry: playConfig.commands, schemaDefinitions: definitions};

      const exe = makeAsyncExecutable(policy.rules);
      const result = await exe(ctx);

      if(result['commands']) {
        for (const command of result['commands']) {
          messageBox.dispatch(command.name, command.payload, command.meta).catch((e: any) => console.error(e));
        }
      }
    }
}
