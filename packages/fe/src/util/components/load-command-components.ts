import React from "react";
import {WithCommandButtonProps} from "@frontend/app/components/core/CommandButton";
import {commands as commandComponents} from "@frontend/app/components/commands";
import {commands as overwriteCommandComponents} from "@frontend/extensions/app/components/commands";
import {CommandComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {isCommandAction} from "@frontend/app/components/core/form/types/action";
export const loadCommandComponent = (commandName: CommandComponent): React.FunctionComponent<any & WithCommandButtonProps> => {
  if(typeof commandName !== "string") {
    commandName = isCommandAction(commandName)? commandName.command : '';
  }

  if(overwriteCommandComponents[commandName]) {

    return overwriteCommandComponents[commandName];
  }

  if(commandComponents[commandName]) {

    return commandComponents[commandName];
  }

  throw new Error(`No command component registered for command: "${commandName}". Please check the registry file: packages/fe/src/app/components/commands.ts!`);
}
