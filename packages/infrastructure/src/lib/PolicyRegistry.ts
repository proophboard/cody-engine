import { Event } from '@event-engine/messaging/event';
import { PolicyDescription } from '@event-engine/descriptions/descriptions';
import { Session } from '@event-engine/infrastructure/MultiModelStore/Session';

export type Policy = (
  event: Event,
  deps: any,
  session?: Session
) => Promise<void>;
export type PolicyRegistry = {
  [eventName: string]: {
    [policyName: string]: { policy: Policy; desc: PolicyDescription };
  };
};
