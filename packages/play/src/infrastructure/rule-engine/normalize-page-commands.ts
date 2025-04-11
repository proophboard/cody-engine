import {normalizeCommandName} from "@cody-play/infrastructure/rule-engine/normalize-command-name";
import {CommandComponent} from "@cody-engine/cody/hooks/utils/ui/types";

export const normalizePageCommands = (commandNames: CommandComponent[], defaultService: string): CommandComponent[] => {
  return commandNames.map(n => {
    if(typeof n !== "string") {
      return {
        ...n,
        command: normalizeCommandName(n.command, defaultService)
      }
    } else {
      return normalizeCommandName(n, defaultService)
    }
  })
}
