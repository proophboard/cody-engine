import React from "react";
import {WithCommandButtonProps} from "@frontend-ai/app/components/core/CommandButton";
import {commands as commandComponents} from "@frontend-ai/app/components/commands";
import {commands as overwriteCommandComponents} from "@frontend-ai/extensions/app/components/commands";
export const loadCommandComponent = (commandName: string): React.FunctionComponent<any & WithCommandButtonProps> => {
  if(overwriteCommandComponents[commandName]) {

    return overwriteCommandComponents[commandName];
  }

  if(commandComponents[commandName]) {

    return commandComponents[commandName];
  }

  throw new Error(`No command component registered for command: "${commandName}". Please check the registry file: packages/fe/src/app/components/commands.ts!`);
}
