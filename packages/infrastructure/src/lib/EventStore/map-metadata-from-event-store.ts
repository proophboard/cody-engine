import {Event} from "@event-engine/messaging/event";
import {AuthService} from "@event-engine/infrastructure/auth-service/auth-service";
import {setMessageMetadata} from "@event-engine/messaging/message";

export const mapMetadataFromEventStore = async (events: Event[], authService?: AuthService | undefined): Promise<Event[]> => {
  const mappedEvents: Event[] = [];

  for (let event of events) {
    if(event.meta.user && typeof event.meta.user === 'string') {
      event = setMessageMetadata(event, 'user', authService
        ? await authService.get(event.meta.user)
        : {userId: event.meta.user}
      );
    }

    mappedEvents.push(event);
  }

  return mappedEvents;
}
