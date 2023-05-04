import {Event} from "@event-engine/messaging/event";

export type EventQueueConsumer = (event: Event) => Promise<boolean>;
export type WaitingQueueListener = (event: Event) => void;

export interface EventQueue {
    sourceStream: () => string;
    getFirstWaitingEvent: () => Promise<Event | null>;
    onEventAddedToWaitingQueue: (listener: WaitingQueueListener) => void;
    attachConsumer: (consumer: EventQueueConsumer) => void;
    detachConsumer: (consumer: EventQueueConsumer) => void;
    startProcessing: () => void;
    pause: () => void;
}
