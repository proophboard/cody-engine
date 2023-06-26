import React from "react";

export type CommandComponentRegistry = {[commandName: string]: React.FunctionComponent};

export const commands: CommandComponentRegistry = {};
