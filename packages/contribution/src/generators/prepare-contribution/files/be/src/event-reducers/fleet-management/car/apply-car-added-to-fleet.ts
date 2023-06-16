import {Event} from "@event-engine/messaging/event";
import {Car} from "@app/shared/types/fleet-management/car/car";
import {CarAddedToFleet} from "@app/shared/events/fleet-management/car/car-added-to-fleet";

export const applyCarAddedToFleet = async (state: Car, event: Event<CarAddedToFleet>): Promise<Car> => {
  return {
    ...state,
    ...event.payload,
    completed: true
  }
}
