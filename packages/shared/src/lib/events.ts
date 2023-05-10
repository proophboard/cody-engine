import { EventRuntimeInfo } from "@event-engine/messaging/event";
import { FleetManagementCarCarAddedToFleetRuntimeInfo } from "@app/shared/events/fleet-management/car/car-added-to-fleet";
import { FleetManagementCarCarUpdatedRuntimeInfo } from "@app/shared/events/fleet-management/car/car-updated";

type EventRegistry = { [eventName: string]: EventRuntimeInfo };

export const events = {
  "FleetManagement.Car.CarAddedToFleet": FleetManagementCarCarAddedToFleetRuntimeInfo,
  "FleetManagement.Car.CarUpdated": FleetManagementCarCarUpdatedRuntimeInfo
};
