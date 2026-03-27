import { Event } from '@event-engine/messaging/event';
import { Session } from '@event-engine/infrastructure/MultiModelStore/Session';

export interface EventBus {
  on: (
    event: Event,
    triggerLiveProjections?: boolean,
    session?: Session
  ) => Promise<boolean>;
}
