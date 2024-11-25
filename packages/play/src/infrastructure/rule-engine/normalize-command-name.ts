export const normalizeCommandName = (commandName: string, defaultService: string): string => {
  if(commandName.split(".").length === 1) {
    return `${defaultService}.${commandName}`;
  }

  return commandName;
}
