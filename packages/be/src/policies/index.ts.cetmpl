import {Event} from "@event-engine/messaging/event";

export type Policy = (event: Event) => Promise<void>;

export type PolicyRegistry = {[eventName: string]: {[policyName: string]: { policy: Policy, desc: PolicyDescription }}};

export const policies: PolicyRegistry = {};
