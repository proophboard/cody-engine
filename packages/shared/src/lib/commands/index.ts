import {CommandRuntimeInfo} from "@event-engine/messaging/command";

import {fleetManagementAddCarToFleetRuntimeInfo} from "@app/shared/commands/fleet-management/add-car-to-fleet";

type CommandRegistry = {[name: string]: CommandRuntimeInfo};

export const commands: CommandRegistry = {
  "FleetManagement.AddCarToFleet": fleetManagementAddCarToFleetRuntimeInfo,
}
