import {EventRuntimeInfo} from "@event-engine/messaging/event";
import {FleetManagementCarCarAddedToFleetRuntimeInfo} from "@app/shared/events/fleet-management/car/car-added-to-fleet";

type EventRegistry = {[eventName: string]: EventRuntimeInfo};

export const events = {
  "FleetManagement.Car.CarAddedToFleet": FleetManagementCarCarAddedToFleetRuntimeInfo,
};
