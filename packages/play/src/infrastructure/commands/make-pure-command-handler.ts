import {ProcessingFunctionWithDeps} from "@event-engine/infrastructure/commandHandling";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {PlayEventRegistry, PlaySchemaDefinitions} from "@cody-play/state/types";
import {Command} from "@event-engine/messaging/command";
import {Event} from "@event-engine/messaging/event";
import {execRuleAsync} from "@cody-play/infrastructure/rule-engine/make-executable";

export const makePureCommandHandler = (
  commandHandlerRules: AnyRule[],
  eventRegistry: PlayEventRegistry,
  schemaDefinitions: PlaySchemaDefinitions
): ProcessingFunctionWithDeps => {
  return async function* (command: Command, dependencies: Record<string, any>): AsyncGenerator<Event> {
    let ctx = {command: command.payload, meta: command.meta, ...dependencies, eventRegistry, schemaDefinitions};

    for (const rule of commandHandlerRules) {
      const [result, nextRule] = await execRuleAsync(rule, ctx);

      if(result.events) {
        for (const evt of result.events) {
          yield evt;
        }
        delete result.events;
      }

      if(!nextRule) {
        return;
      }

      ctx = result;
    }
  }
}
