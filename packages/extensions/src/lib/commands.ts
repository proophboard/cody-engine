import {ProcessingFunction, ProcessingFunctionWithDeps} from "@event-engine/infrastructure/commandHandling";

type CommandExtensions = {[commandName: string]: ProcessingFunction | ProcessingFunctionWithDeps}

export const commandExtensions: CommandExtensions = {};
