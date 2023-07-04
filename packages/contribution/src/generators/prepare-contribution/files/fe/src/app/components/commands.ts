import React from "react";
import FleetManagementAddCarToFleet  from "@frontend/app/components/fleet-management/commands/AddCarToFleet";
import {WithCommandButtonProps} from "@frontend/app/components/core/CommandButton";

export type CommandComponentRegistry = {[commandName: string]: React.FunctionComponent<any & WithCommandButtonProps>};

export const commands: CommandComponentRegistry = {
  "FleetManagement.AddCarToFleet": FleetManagementAddCarToFleet
};
