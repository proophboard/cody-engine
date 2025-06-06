import {normalizeCommandName} from "@cody-play/infrastructure/rule-engine/normalize-command-name";
import {CommandComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {isCommandAction} from "@frontend/app/components/core/form/types/action";
import {normalizeAction, normalizeServerUiSchema} from "@frontend/util/schema/normalize-ui-schema";

export const normalizePageCommands = (commandNames: CommandComponent[], defaultService: string): CommandComponent[] => {
  return commandNames.map(n => {
    if(typeof n !== "string") {
      normalizeAction(n, defaultService);

      if(isCommandAction(n)) {
        const uiSchema = n.uiSchema ? normalizeServerUiSchema(n.uiSchema, defaultService) : undefined;
        return {
          ...n,
          uiSchema,
          command: normalizeCommandName(n.command, defaultService)
        }
      }

      return n;
    } else {
      return normalizeCommandName(n, defaultService)
    }
  })
}
