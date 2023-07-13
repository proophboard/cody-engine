import { Car } from '@app/shared/types/fleet-management/car/car';
import { Command } from '@event-engine/messaging/command';
import { Event } from '@event-engine/messaging/event';
import jexl from "@app/shared/jexl/get-configured-jexl";
import { UpdateCar } from '@app/shared/commands/fleet-management/update-car';
import { carUpdated } from '@app/shared/events/fleet-management/car/car-updated';
import { carAddedToFleet } from '@app/shared/events/fleet-management/car/car-added-to-fleet';

export const handleUpdateCar = async function* (
  car: Partial<Car>,
  command: Command<UpdateCar>
): AsyncGenerator<Event> {
  const ctx: any = {};
  ctx['car'] = car;
  ctx['command'] = command.payload;

  yield carUpdated(await jexl.eval('command', ctx));

  if (await jexl.eval('command.productionYear', ctx)) {
    yield carAddedToFleet({
      vehicleId: await jexl.eval('car.vehicleId', ctx),
    });
  }
};
