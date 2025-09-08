import {ProcessingFunctionWithDeps} from "@server/infrastructure/commandHandling";
import {AnyRule} from "@app/shared/rule-engine/configuration";
import {PlayEventRegistry, PlaySchemaDefinitions} from "@cody-play/state/types";
import {Command} from "@event-engine/messaging/command";
import {Event} from "@event-engine/messaging/event";
import {CTX_RECORDED_EVENTS_KEY, execRuleAsync} from "@cody-play/infrastructure/rule-engine/make-executable";
import {Palette} from "@cody-play/infrastructure/utils/styles";
import {CommandDescription} from "@event-engine/descriptions/descriptions";

export const makePureCommandHandler = (
  commandHandlerRules: AnyRule[],
  eventRegistry: PlayEventRegistry,
  schemaDefinitions: PlaySchemaDefinitions,
  commandDescription: CommandDescription,
  verbose = true
): ProcessingFunctionWithDeps => {
  return async function* (command: Command, dependencies: Record<string, any>): AsyncGenerator<Event> {
    let ctx = {command: command.payload, meta: command.meta, ...dependencies, eventRegistry, schemaDefinitions};

    if(verbose) {
      console.log(
        `%c[CommandBus] Executing business rules of %c${command.name}`, Palette.cColor(Palette.stickyColors.command), Palette.cColorBold(Palette.stickyColors.command),
        commandDescription._pbLink,
        {
          ctx,
          rules: commandHandlerRules
        }
      )
    } else {
      console.log(
        `%c[CommandBus] Executing business rules of %c${command.name}`, Palette.cColor(Palette.stickyColors.command), Palette.cColorBold(Palette.stickyColors.command),
        commandDescription._pbLink,
      )
    }

    for (const rule of commandHandlerRules) {
      const [result, nextRule] = await execRuleAsync(rule, ctx);

      if(result[CTX_RECORDED_EVENTS_KEY]) {
        for (const evt of result[CTX_RECORDED_EVENTS_KEY]) {
          yield evt;
        }
        delete result[CTX_RECORDED_EVENTS_KEY];
      }

      if(!nextRule) {
        return;
      }

      ctx = result;
    }
  }
}
