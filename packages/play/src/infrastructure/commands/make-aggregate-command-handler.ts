import {AnyRule} from "@cody-engine/cody/hooks/rule-engine/configuration";
import {Command} from "@event-engine/messaging/command";
import {Event} from "@event-engine/messaging/event";
import {AggregateProcessingFunctionWithDeps} from "@server/infrastructure/commandHandling";
import {CTX_RECORDED_EVENTS_KEY, execRuleAsync} from "@cody-play/infrastructure/rule-engine/make-executable";
import {PlayEventRegistry, PlaySchemaDefinitions} from "@cody-play/state/types";

export const makeAggregateCommandHandler = (
  commandHandlerRules: AnyRule[],
  eventRegistry: PlayEventRegistry,
  schemaDefinitions: PlaySchemaDefinitions
): AggregateProcessingFunctionWithDeps => {
  return async function* (state: any, command: Command, dependencies: Record<string, any>): AsyncGenerator<Event> {
    let ctx = {information: state, command: command.payload, meta: command.meta, ...dependencies, eventRegistry, schemaDefinitions};

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
