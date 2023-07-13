import { Car } from '@app/shared/types/fleet-management/car/car';
import { Command } from '@event-engine/messaging/command';
import { Event } from '@event-engine/messaging/event';
import jexl from "@app/shared/jexl/get-configured-jexl";
import { AddCarToFleet } from '@app/shared/commands/fleet-management/add-car-to-fleet';
import { carAddedToFleet } from '@app/shared/events/fleet-management/car/car-added-to-fleet';
import { incompleteCarAdded } from '@app/shared/events/fleet-management/car/incomplete-car-added';
import { carAdded } from '@app/shared/events/fleet-management/car/car-added';

export const handleAddCarToFleet = async function* (
  car: Partial<Car>,
  command: Command<AddCarToFleet>
): AsyncGenerator<Event> {
  const ctx: any = {};
  ctx['car'] = car;
  ctx['command'] = command.payload;

  if (!(await jexl.eval('command.productionYear', ctx))) {
    yield incompleteCarAdded(await jexl.eval('command', ctx));
    return;
  }

  if (await jexl.eval('command.productionYear', ctx)) {
    yield carAdded(await jexl.eval('command', ctx));
    yield carAddedToFleet({
      vehicleId: await jexl.eval('command.vehicleId', ctx),
    });
  }
};
