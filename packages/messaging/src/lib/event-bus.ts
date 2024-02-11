import {Event} from "@event-engine/messaging/event";

export interface EventBus {
  on: (event: Event, triggerLiveProjections?: boolean) => Promise<boolean>;
}
