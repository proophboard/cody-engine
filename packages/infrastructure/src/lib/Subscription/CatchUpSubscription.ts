/* eslint-disable no-prototype-builtins */
import {EventStore, MetadataMatcher} from "../EventStore";
import {EventQueue, EventQueueConsumer} from "../EventQueue";
import {Event} from "@event-engine/messaging/event";

type CurrentEventId = string;

export type SubscriptionInitializer = () => Promise<[CurrentEventId | undefined, MetadataMatcher | undefined]>;

export type SubscriptionInitializerMap = {[streamName: string]: SubscriptionInitializer};

export type EventQueueMap = {[streamName: string]: EventQueue};

type FirstEventsMap = {[streamName: string]: Event | undefined};

type LastProcessedEventMap = {[streamName: string]: Event | undefined};

export type LastProcessedEventListener = (streamName: string, event: Event) => Promise<void>;

/**
 * A catch-up subscription loads older events from an event store before processing new events.
 * It relies on an initializer function per stream to know the exact stream position from where to load older events.
 */
export class CatchUpSubscription {

    /**
     * The subscription can process events from multiple source streams
     */
    private readonly streamNames: string[];

    /**
     * All events are forwarded to a single consumer
     */
    private readonly consumer: EventQueueConsumer;

    /**
     * All streams should be accessible through this event store.
     */
    private readonly eventStore: EventStore;

    /**
     * The subscription uses source stream queues to consume events.
     */
    private readonly eventQueues: EventQueueMap;

    /**
     * An initializer per stream should provide filter and start event id for the "old events" lookup query.
     */
    private readonly initializers: SubscriptionInitializerMap = {};

    /**
     * Old events loaded from the event store are checked against new events waiting in the source stream queues.
     * This is a deduplication mechanism to avoid processing of the same event twice.
     */
    private firstEventsInWaitingQueues: FirstEventsMap = {};

    /**
     * A subscription can be paused, e.g. to prepare a deployment of a newer subscription version
     */
    private paused = false;

    /**
     * Cache last processed events per stream
     */
    private lastProcessedEvents: LastProcessedEventMap = {};

    /**
     * Notify a listener each time an event is processed successfully
     */
    private lastProcessedEventListener: LastProcessedEventListener;

    constructor(
      streamNames: string[],
      consumer: EventQueueConsumer,
      eventStore: EventStore,
      eventQueues: EventQueue[],
      initializers?: SubscriptionInitializerMap,
      lastProcessedEventListener?: LastProcessedEventListener
    ) {
        this.streamNames = streamNames;
        this.consumer = consumer;
        this.eventStore = eventStore;

        const map: EventQueueMap = {};
        eventQueues.forEach(q => map[q.sourceStream()] = q);
        this.eventQueues = map;

        if(typeof initializers === 'undefined') {
            initializers = {};
        }

        this.initializers = initializers;

        if(typeof lastProcessedEventListener === 'undefined') {
            lastProcessedEventListener = async () => { return; };
        }

        this.lastProcessedEventListener = lastProcessedEventListener;

        this.streamNames.forEach(streamName => {
            if(!this.eventQueues.hasOwnProperty(streamName)) {
                throw new Error(`No event queue provided from stream ${streamName}`);
            }

            if(!this.initializers.hasOwnProperty(streamName)) {
                this.initializers[streamName] = async () => {
                    return [ this.lastProcessedEvents[streamName]? this.lastProcessedEvents[streamName]?.uuid : undefined, undefined]
                };
            }
        })

        for (const stream in this.eventQueues) {
            if(!this.eventQueues.hasOwnProperty(stream)) {
                continue;
            }
            this.eventQueues[stream].onEventAddedToWaitingQueue((waitingEvent: Event) => {
                if(!this.firstEventsInWaitingQueues[stream]) {
                    this.firstEventsInWaitingQueues[stream] = waitingEvent;
                }
            })
        }
    }

    public async startProcessing(): Promise<boolean> {
        this.paused = false;

        for(const streamName of this.streamNames) {
            if(!this.eventQueues[streamName]) {
                continue;
            }

            this.eventQueues[streamName].startProcessing();

            const firstWaitingEvent = await this.eventQueues[streamName].getFirstWaitingEvent();

            if(firstWaitingEvent && !this.firstEventsInWaitingQueues[streamName]) {
                this.firstEventsInWaitingQueues[streamName] = firstWaitingEvent;
            }

            const [fromEventId, metadataMatcher] = await this.initializers[streamName]();

            const streamEvents = await this.eventStore.load(streamName, metadataMatcher, fromEventId);

            for await (const evt of streamEvents) {
                if(this.paused || (this.firstEventsInWaitingQueues[streamName] && this.firstEventsInWaitingQueues[streamName]?.uuid === evt.uuid)) {
                    break;
                }

                const success = await this.consumer(evt);

                if(!success) {
                    return false;
                }
                this.lastProcessedEvents[streamName] = evt;
                await this.lastProcessedEventListener(streamName, evt);
            }

            if(this.paused) {
                this.pause();
                return false;
            }


            this.eventQueues[streamName].attachConsumer(async evt => {
                const success = await this.consumer(evt);
                if(success) {
                    this.lastProcessedEvents[streamName] = evt;
                    await this.lastProcessedEventListener(streamName, evt);
                }
                return success;
            });
        }

        return true;
    }

    public pause(): void {
        for(const streamName of this.streamNames) {
            this.eventQueues[streamName].pause();
        }
        this.paused = true;
    }
}
