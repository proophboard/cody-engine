import {CommandHandlerRegistry} from "@event-engine/infrastructure/commandHandling";
import {handleAddCarToFleet} from "@server/command-handlers/fleet-management/car/handle-add-car-to-fleet";

export const commandHandlers: CommandHandlerRegistry = {
  "FleetManagement.AddCarToFleet": handleAddCarToFleet,
}
