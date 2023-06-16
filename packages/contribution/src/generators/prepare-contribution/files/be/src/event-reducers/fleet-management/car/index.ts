import { ApplyFunctionRegistry } from "@event-engine/infrastructure/AggregateRepository";
import { Car } from "@app/shared/types/fleet-management/car/car";
import { applyCarAdded } from "@server/event-reducers/fleet-management/car/apply-car-added";
import { applyCarAddedToFleet } from "./apply-car-added-to-fleet";

const reducers: ApplyFunctionRegistry<Car> = {
  "FleetManagement.Car.CarAddedToFleet": applyCarAddedToFleet,
  "FleetManagement.Car.CarAdded": applyCarAdded
};

export default reducers;
