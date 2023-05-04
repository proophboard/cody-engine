import {EventStore} from "../EventStore";
import {EventQueue, EventQueueConsumer, WaitingQueueListener} from "../EventQueue";
import {Event} from "@event-engine/messaging/event";

/**
 * This queue implementation attaches a "appendTo listener" to an event store to forward all events appended to
 * a stream to an event consumer, too. This queue is useful for "in-process" event processing.
 */
export class InMemoryStreamListenerQueue implements EventQueue{
    private eventStore: EventStore;
    private streamName: string;
    private consumer: undefined | EventQueueConsumer = undefined;
    private queue: Event[] = [];
    private listener: any;
    private waitingQueueListener: WaitingQueueListener | undefined;

    public constructor(eventStore: EventStore, streamName: string) {
        this.eventStore = eventStore;
        this.streamName = streamName;
    }

    public sourceStream(): string {
        return this.streamName;
    }

    public async getFirstWaitingEvent(): Promise<Event | null> {
        if(this.queue.length === 0) {
            return null;
        }

        return this.queue.slice(0, 1).pop() as Event;
    }

    public onEventAddedToWaitingQueue(listener: WaitingQueueListener): void {
        this.waitingQueueListener = listener;
    }

    public attachConsumer(consumer: EventQueueConsumer): void {
        this.consumer = consumer;
        this.processEventsInQueue();
    }

    public detachConsumer(consumer: EventQueueConsumer): void {
        this.consumer = undefined;
    }

    public startProcessing(): void {
        this.listener = (streamName: string, events: Event[]) => {
            if(streamName === this.streamName) {
                events.forEach(evt => {
                    console.log(`[StreamListenerQueue] Start Processing event ${evt.name} (${evt.uuid}) of stream ${streamName}`);

                    if(this.consumer) {
                        console.log(`[StreamListenerQueue] Calling consumer with event ${evt.name} (${evt.uuid})`);

                        this.consumer.call(this.consumer, evt).then(success => {
                            if(!success) {
                                console.log(`[StreamListenerQueue] Consumer returned false. Pushing event ${evt.name} (${evt.uuid}) back on queue.`);

                                this.queue.push(evt);
                            }
                        }, reason => {
                            console.error(`[StreamListenerQueue] Stream consumer ${this.streamName} failed to handle event ${evt.name} (${evt.uuid}): `, reason);
                        });
                    } else {
                        console.log(`[StreamListenerQueue] No consumer set for event ${evt.name} (${evt.uuid}). Pushing it on waiting queue.`);

                        this.queue.push(evt);
                        if(this.waitingQueueListener) {
                            this.waitingQueueListener(evt);
                        }
                    }
                })

                this.processEventsInQueue();
            }
        };
        this.eventStore.attachAppendToListener(this.listener);
    }

    public pause(): void {
        this.eventStore.detachAppendToListener(this.listener);
    }

    private processEventsInQueue(): void {
        if(this.consumer && this.queue.length) {
            const notHandledEvents: Event[] = [];
            this.queue.forEach(evt => {
                this.consumer?.call(this.consumer, evt).then(success => {
                    if(!success) {
                        notHandledEvents.push(evt);
                    }
                })
            })

            this.queue = notHandledEvents;
        }
    }
}
