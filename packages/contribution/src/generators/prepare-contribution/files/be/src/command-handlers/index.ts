import { CommandHandlerRegistry } from "@event-engine/infrastructure/commandHandling";
import { handleAddCarToFleet } from "@server/command-handlers/fleet-management/car/handle-add-car-to-fleet";
import { handleUpdateCar as handleFleetManagementUpdateCar } from "@server/command-handlers/fleet-management/car/handle-update-car";

export const commandHandlers: CommandHandlerRegistry = {
  "FleetManagement.AddCarToFleet": handleAddCarToFleet,
  "FleetManagement.UpdateCar": handleFleetManagementUpdateCar
}
