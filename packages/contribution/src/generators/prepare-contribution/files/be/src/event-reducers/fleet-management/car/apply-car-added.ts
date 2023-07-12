import {Event} from "@event-engine/messaging/event";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {Car} from "@app/shared/types/fleet-management/car/car";
import {CarAdded} from "@app/shared/events/fleet-management/car/car-added";

export const applyCarAdded = async (car: Car, event: Event<CarAdded>): Promise<Car> => {
  const ctx: any = {};
  ctx['car'] = car;
  ctx['event'] = event.payload;
  ctx['meta'] = event.meta;


ctx['car'] = {
    ...await jexl.eval("car", ctx),
    ...await jexl.eval("event", ctx),
  }


  return ctx['car'];
}
