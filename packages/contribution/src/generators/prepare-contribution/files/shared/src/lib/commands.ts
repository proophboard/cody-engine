import { CommandRuntimeInfo } from "@event-engine/messaging/command";

import { FleetManagementAddCarToFleetRuntimeInfo } from "@app/shared/commands/fleet-management/add-car-to-fleet";
import { FleetManagementUpdateCarRuntimeInfo } from "@app/shared/commands/fleet-management/update-car";

type CommandRegistry = { [name: string]: CommandRuntimeInfo };

export const commands: CommandRegistry = {
  "FleetManagement.AddCarToFleet": FleetManagementAddCarToFleetRuntimeInfo,
  "FleetManagement.UpdateCar": FleetManagementUpdateCarRuntimeInfo
}
