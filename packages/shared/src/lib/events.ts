import { EventRuntimeInfo } from "@event-engine/messaging/event";

type EventRegistry = { [eventName: string]: EventRuntimeInfo };

export const events: EventRegistry = {
};
