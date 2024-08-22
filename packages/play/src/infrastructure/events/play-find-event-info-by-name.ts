import {CodyPlayConfig} from "@cody-play/state/config-store";
import {PlayEventRuntimeInfo} from "@cody-play/state/types";
import {names} from "@event-engine/messaging/helpers";

export const playFindEventInfoByName = (eventName: string, config: CodyPlayConfig): PlayEventRuntimeInfo | undefined => {
  if(config.events[eventName]) {
    return config.events[eventName];
  }

  eventName = names(eventName).className;

  const listOfEvents = Object.keys(config.events);

  for (const existingEventName of listOfEvents) {
    const parts = existingEventName.split(".");
    const lastPart = parts[parts.length - 1];

    if(eventName === lastPart) {
      return config.events[existingEventName];
    }
  }
}
