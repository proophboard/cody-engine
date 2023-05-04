import {Event} from "@event-engine/messaging/event";
import {randomUUID} from "crypto";

export const makeTestEvent = (params: Partial<Event> = {}): Event => {
  return {
    uuid: randomUUID(),
    payload: {test: "event"},
    meta: {test: "meta"},
    name: "Test Event",
    createdAt: new Date(),
    ...params
  }
}

describe('Test Helpers', () => {
  it('makes test event', () => {
    const testEvent = makeTestEvent({name: 'Param Test'});

    expect(testEvent.name).toBe('Param Test');
  })
})
