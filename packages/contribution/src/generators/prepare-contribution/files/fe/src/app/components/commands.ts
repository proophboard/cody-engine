import React from "react";
import FleetManagementAddCarToFleet  from "@frontend/app/components/fleet-management/commands/AddCarToFleet";

export type CommandComponentRegistry = {[commandName: string]: React.FunctionComponent};

export const commands: CommandComponentRegistry = {
  "FleetManagement.AddCarToFleet": FleetManagementAddCarToFleet
};
