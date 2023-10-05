import { before, binding, given, then, when } from "cucumber-tsflow";
import {addCarToFleet} from "@app/shared/commands/fleet-management/add-car-to-fleet";
import { Event } from "@event-engine/messaging/event";
import { getConfiguredMessageBox } from "@server/infrastructure/configuredMessageBox";
import { getConfiguredEventStore } from "@server/infrastructure/configuredEventStore";
import {carAdded} from "@app/shared/events/fleet-management/car/car-added";
import {incompleteCarAdded} from "@app/shared/events/fleet-management/car/incomplete-car-added";
import expect from "expect";


@binding()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class AddCarToFleetSteps {
  private messageBox = getConfiguredMessageBox();
  private eventStore = getConfiguredEventStore();
  private events: Event[] = [];

  @before()
  public setup(): void {
    const listener = (streamName: string, events: Event[]) => {
      this.events.push(...events);
    };
    this.eventStore.attachAppendToListener(listener);
  }

  @given('Car Added')
  public async givenCarAdded(): Promise<void> {
    const payload = {
      'productionYear': 1998,
'vehicleId': '6a76bead-46ce-4651-bea0-d8a387b2e9d0',
'brand': 'Ford',
'model': 'Focus'
    };

    const event = carAdded(payload);

    await this.messageBox.dispatch(event.name, event.payload, event.meta);
  }

/* multiple givens via iterator like above
  @given('Car Added To Fleet')
  public async givenCarAddedToFleet(): Promise<void> {
    const payload = {
      'vehicleId': '6a76bead-46ce-4651-bea0-d8a387b2e9d0',
    };

    const event = carAddedToFleet(payload);

    await this.messageBox.dispatch(event.name, event.payload, event.meta);
  }
*/

  @when('Add Car To Fleet')
  public async whenAddCarToFleet(): Promise<void> {
    const payload = {
      'vehicleId': '6a76bead-46ce-4651-bea0-d8a387b2e9d0',
'brand': 'BMW',
'model': '1er'
    };

    const command = addCarToFleet(payload);

    await this.messageBox.dispatch(command.name, command.payload, command.meta);
  }

  @then('Incomplete Car Added')
  public async thenIncompleteCarAdded(): Promise<void> {
    const identifier = '6a76bead-46ce-4651-bea0-d8a387b2e9d0';
    const expectedPayload = {
      'vehicleId': '6a76bead-46ce-4651-bea0-d8a387b2e9d0', 'brand': 'BMW',
'model': '1er'
    };
    const expectedEvent = incompleteCarAdded(expectedPayload);

    const newestEventToCompare = this.events.
    filter((event: Event) => {
      return event.name === expectedEvent.name && event.meta.aggregateId === identifier;
    }).sort((event1, event2) => {
      return event2.createdAt.getTime() - event1.createdAt.getTime();
    }).pop();

    expect(newestEventToCompare).toBeDefined();
    expect(newestEventToCompare?.payload).toEqual(expectedPayload);
  }
}
