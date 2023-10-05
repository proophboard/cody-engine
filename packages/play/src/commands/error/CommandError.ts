export class CommandError extends Error {
  constructor(commandName: string) {
    super(`Executing command "${commandName}" failed. Take a look at your browser console for details.`);
  }
}
