import { binding, given, then, when } from "cucumber-tsflow";
import { Car } from '@app/shared/types/fleet-management/car/car';
import { addCarToFleet } from "@app/shared/commands/fleet-management/add-car-to-fleet";
import { handleAddCarToFleet } from "@server/command-handlers/fleet-management/car/handle-add-car-to-fleet";
import { Event } from "@event-engine/messaging/event";
@binding()
class AddCarToFleetSteps {

  private car: Car | undefined;
  private events: Array<Event> = [];
  @given('car is BMW model 1er')
  public givenCarWithBrandAndModel (): void  {
    this.car = {
      'vehicleId': 'f832125e-4a4f-4cef-963c-c783a73a52fe',
      'brand' : 'BMW',
      'model': '1er'
    };
  }

  @when(/I add the car to the fleet/)
  public addsCarToFleet(): void {
    const car = this.car;
    if (car === undefined) {

      return;
    }
    const command = addCarToFleet({...car});
    (async () => {
      for await (const event of handleAddCarToFleet(car, command))
        this.events.push(event);
    })();
  }

  @then(/an incomplete car should be added/)
  public thenIncompleteCarAdded(): void {
    expect(this.events).toHaveLength(1);
    const receivedEvent = this.events.pop();

    expect(receivedEvent?.name).toBe('FleetManagement.Car.IncompleteCarAdded');
  }
}

export = AddCarToFleetSteps;
