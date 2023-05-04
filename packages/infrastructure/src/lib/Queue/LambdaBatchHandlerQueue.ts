import {EventQueue, EventQueueConsumer, WaitingQueueListener} from "@event-engine/infrastructure/EventQueue";
import {Event} from "@event-engine/messaging/event";

export interface LambdaMessage {
  messageId: string;
  event: Event
}

export type MessageListener = (failedMessage: LambdaMessage) => void;

export type ProcessingFinishedListener = () => void;

/**
 * This queue implementation can be used to forward a batch of messages received from AWS SQS in a Lambda function
 * to an event consumer. Depending on FIFO mode the queue either tries to forward all events to the consumer
 * or stops after the first failed event.
 */
export class LambdaBatchHandlerQueue implements EventQueue {
  /**
   * Source stream of events published to this queue
   */
  private streamName: string;

  /**
   * Event consumer
   *
   * Processing will start when a consumer is attached, meanwhile events are "waiting"
   */
  private consumer: undefined | EventQueueConsumer = undefined;

  /**
   * Internal buffer of events wrapped in Lambda Messages
   */
  private queue: LambdaMessage[] = [];

  /**
   * A waiting queue listener is notified as soon as events are available in the queue,
   * but the listener does not consume the events itself
   */
  private waitingQueueListener: WaitingQueueListener | undefined;

  /**
   * Called when a consumer reutrns true
   */
  private succeededMessageListeners: MessageListener[] = [];

   /**
   * Called when a consumer returns false
   */
  private failedMessageListeners: MessageListener[] = [];

  /**
   * Called each time a processEventsInQueue() run is finished
   */
  private processingFinishedListeners: ProcessingFinishedListener[] = [];

  /**
   * Indicating if processing should stop after first failed event (FIFO = true) or if the queue should continue processing
   * and only notify failed event listeners
   */
  private readonly fifoMode: boolean = false;

  /**
   * Queue can be paused
   */
  private paused = false;

  public constructor(streamName: string, fifoMode = false) {
    this.streamName = streamName;
    this.fifoMode = fifoMode;
  }

  public sourceStream(): string {
    return this.streamName;
  }

  public async getFirstWaitingEvent(): Promise<Event | null> {
    if(this.queue.length === 0) {
      return null;
    }

    return this.queue.slice(0, 1).pop()?.event as Event;
  }

  public onEventAddedToWaitingQueue(listener: WaitingQueueListener): void {
    this.waitingQueueListener = listener;
  }

  public attachConsumer(consumer: EventQueueConsumer): void {
    this.consumer = consumer;
    this.processEventsInQueue().then(undefined, this.logError);
  }

  public detachConsumer(consumer: EventQueueConsumer): void {
    if(this.consumer === consumer) {
      this.consumer = undefined;
    }
  }

  /**
   * @param messages
   * @return Promise<LambdaMessage[]> List of failed messages
   */
  public async push(messages: LambdaMessage[]): Promise<LambdaMessage[]> {
    return new Promise((resolve) => {
      const processedMessages: LambdaMessage[] = [];
      const failedMessages: LambdaMessage[] = [];

      const succeededMessageListener: MessageListener = (succeededMessage: LambdaMessage) => {
        if(messages.includes(succeededMessage)) {
          processedMessages.push(succeededMessage);
        }
      }

      const failedMessageListener: MessageListener = (failedMessage) => {
        if(messages.includes(failedMessage)) {
          processedMessages.push(failedMessage);
          failedMessages.push(failedMessage);
        }
      }

      this.onSucceededMessage(succeededMessageListener);
      this.onFailedMessage(failedMessageListener);

      const processingFinishedListener: ProcessingFinishedListener = () => {
        if(processedMessages.length === messages.length) {
          this.offSucceededMessage(succeededMessageListener);
          this.offFailedMessage(failedMessageListener);
          this.offProcessingFinished(processingFinishedListener);
          resolve(failedMessages);
        }
      }

      this.onProcessingFinished(processingFinishedListener);
      this.queue.push(...messages);
      this.startProcessing();
    })

  }

  public startProcessing(): void {
    this.paused = false;
    this.processEventsInQueue().then(undefined, this.logError);
  }

  public pause(): void {
    this.paused = true;
  }

  public onSucceededMessage (listener: MessageListener): void {
    this.succeededMessageListeners.push(listener);
  }

  public offSucceededMessage (listener: MessageListener): void {
    this.succeededMessageListeners = this.succeededMessageListeners.filter(l => l !== listener);
  }

  public onFailedMessage (listener: MessageListener): void {
    this.failedMessageListeners.push(listener);
  }

  public offFailedMessage(listener: MessageListener): void {
    this.failedMessageListeners = this.failedMessageListeners.filter(fl => fl !== listener);
  }

  public onProcessingFinished (listener: ProcessingFinishedListener): void {
    this.processingFinishedListeners.push(listener);
  }

  public offProcessingFinished (listener: ProcessingFinishedListener): void {
    this.processingFinishedListeners = this.processingFinishedListeners.filter(l => l !== listener);
  }

  private async processEventsInQueue(): Promise<void> {
    if(!this.paused && this.consumer && this.queue.length) {

      let handleAllEventsAsFailed = false;

      for(const msg of this.queue) {
        const success = handleAllEventsAsFailed? false : await this.consumer?.call(this.consumer, msg.event);

        if(!success) {
          this.failedMessageListeners.forEach(l => l(msg))

          // Stop processing after first failed event in queue if FIFO mode is enabled
          if(this.fifoMode) {
            handleAllEventsAsFailed = true;
          }
        } else {
          this.succeededMessageListeners.forEach(l => l(msg));
        }
      }

      this.queue = [];
    }

    this.processingFinishedListeners.forEach(l => l());
  }

  private logError(error: any) {
    console.error(`[LambdaBatchHandlerQueue] Failed to process events in queue: `, error);
  }
}
