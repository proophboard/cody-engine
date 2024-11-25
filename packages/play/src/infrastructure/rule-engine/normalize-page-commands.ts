import {normalizeCommandName} from "@cody-play/infrastructure/rule-engine/normalize-command-name";

export const normalizePageCommands = (commandNames: string[], defaultService: string): string[] => {
  return commandNames.map(n => normalizeCommandName(n, defaultService))
}
