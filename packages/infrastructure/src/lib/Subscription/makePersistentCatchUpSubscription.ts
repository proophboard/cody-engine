/* eslint-disable no-prototype-builtins */
import {
  CatchUpSubscription,
  LastProcessedEventListener, SubscriptionInitializer,
  SubscriptionInitializerMap
} from "@event-engine/infrastructure/Subscription/CatchUpSubscription";
import {EventQueue, EventQueueConsumer} from "@event-engine/infrastructure/EventQueue";
import {EventStore, MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {DocumentStore} from "@event-engine/infrastructure/DocumentStore";
import {Event} from "@event-engine/messaging/event";

export const SUBSCRIPTIONS_COLLECTION = 'event_store_subscriptions';

type StreamInfo = {lastProcessedEvent: string | undefined, metadataMatcher: MetadataMatcher | undefined};

export type SubscriptionSnapshot = {[streamName: string]: StreamInfo};

/**
 * Wraps a catch-up subscription with a persistence layer to remember last processed events after restart of
 * the subscription.
 *
 * @param subscriptionName
 * @param streamNames
 * @param consumer
 * @param eventQueues
 * @param eventStore
 * @param documentStore
 * @param initializers
 */
export const makePersistentCatchUpSubscription = (
  subscriptionName: string,
  streamNames: string[],
  consumer: EventQueueConsumer,
  eventQueues: EventQueue[],
  eventStore: EventStore,
  documentStore: DocumentStore,
  initializers?: SubscriptionInitializerMap
): CatchUpSubscription => {
  let subscriptionSnapshot: SubscriptionSnapshot | null;

  if(!initializers) {
    initializers = {};
  }

  const snapshotInitializer = async (streamName: string): Promise<[string | undefined, MetadataMatcher | undefined]> => {
    if(!subscriptionSnapshot) {
      subscriptionSnapshot = await documentStore.getDoc<SubscriptionSnapshot>(SUBSCRIPTIONS_COLLECTION, subscriptionName);
    }

    if(!subscriptionSnapshot) {
      subscriptionSnapshot = {};

      for (const name of streamNames) {
        if(initializers?.hasOwnProperty(name)) {
          const [lastProcessedEvent, metadataMatcher] = await initializers[name]();

          subscriptionSnapshot[name] = {lastProcessedEvent, metadataMatcher};
        } else {
          subscriptionSnapshot[name] = {lastProcessedEvent: undefined, metadataMatcher: undefined};
        }
      }
    }

    const streamSnapshot = subscriptionSnapshot[streamName];

    return [streamSnapshot.lastProcessedEvent, streamSnapshot.metadataMatcher];
  }

  streamNames.forEach(streamName => initializers![streamName] = makeSubscriptionInitializerForStream(streamName, snapshotInitializer));

  const lastProcessedEventListener: LastProcessedEventListener = async (streamName: string, event: Event): Promise<void> => {
    if(subscriptionSnapshot) {
      subscriptionSnapshot[streamName].lastProcessedEvent = event.uuid;

      await documentStore.upsertDoc(SUBSCRIPTIONS_COLLECTION, subscriptionName, subscriptionSnapshot);
    }
  }

  return new CatchUpSubscription(
    streamNames,
    consumer,
    eventStore,
    eventQueues,
    initializers,
    lastProcessedEventListener
  )
}

const makeSubscriptionInitializerForStream = (
  streamName: string,
  snapshotInitializer: (streamName: string) => Promise<[string | undefined, MetadataMatcher | undefined]>)
  : SubscriptionInitializer => {
  return () => {
    return snapshotInitializer(streamName);
  }
}
