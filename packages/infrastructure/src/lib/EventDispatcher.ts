import {Event, EventMeta} from "@event-engine/messaging/event";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import {Payload} from "@event-engine/messaging/message";

export type EventListener = (event: Event) => Promise<boolean>;
export type EventListenerMap = Record<string, EventListener[]>;
export type EventDispatcher = EventListener;

const merge = (event1: Writable<Event>, event2: Event): Event => {
  event1.createdAt = event2.createdAt;
  event1.uuid = event2.uuid;
  return event1 as Readonly<Event>;
}

export const validate = <P extends Payload = any, M extends EventMeta = any>(listener: EventListener, eventFactory: (payload: any, meta: any) => Event<P,M>): EventListener => {
  return (async (event: Event): Promise<boolean> => {
    const validatedEvent = merge(eventFactory(event.payload, event.meta) as unknown as Writable<Event>, event);
    return await listener(validatedEvent);
  })
};

export const makeEventDispatcher = (listenerMap: EventListenerMap): EventDispatcher => {
  return (async (event): Promise<boolean> => {
    let allListenersSucceeded = true;
    if(listenerMap[event.name]) {
      for (const l of listenerMap[event.name]) {
        let success = false;
        try {
          success = await l(event);
        } catch (e) {
          console.error(e);
        }


        if(!success) {
          allListenersSucceeded = false;
        }
      }
    }

    return allListenersSucceeded;
  }) as EventDispatcher;
}
