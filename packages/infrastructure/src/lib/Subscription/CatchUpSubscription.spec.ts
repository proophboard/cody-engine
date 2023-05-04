import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {Event} from "@event-engine/messaging/event";
import {makeTestEvent} from "@event-engine/infrastructure/helpers.spec";
import {CatchUpSubscription, SubscriptionInitializerMap} from "@event-engine/infrastructure/Subscription/CatchUpSubscription";
import {LambdaBatchHandlerQueue, LambdaMessage} from "@event-engine/infrastructure/Queue/LambdaBatchHandlerQueue";
import {randomUUID} from "crypto";
import {MatchOperator} from "@event-engine/infrastructure/EventStore";

describe('CatchUpSubscription', () => {
  const es = new InMemoryEventStore();
  const TEST_STREAM = 'test_stream';

  es.createStream(TEST_STREAM);

  const oldEvents: Event[] = [];

  for(let i = 1; i <= 3; i++) {
    oldEvents.push(makeTestEvent({
        name: 'Old Event ' + i,
      }
    ));
  }

  beforeAll(async () => {
    await es.appendTo(TEST_STREAM, oldEvents);
  })

  const newEvents: LambdaMessage[] = [];
  for(let i = 1; i <= 3; i++) {
    newEvents.push({
      messageId: randomUUID(),
      event: makeTestEvent({
          name: 'New Event ' + i,
        }
      )
    });
  }

  it('loads old events before processing new', async () => {
    const processedEvents: string[] = [];


    const consumer = async (evt: Event): Promise<boolean> => {
      processedEvents.push(evt.name);
      return true;
    }

    const queue = new LambdaBatchHandlerQueue(TEST_STREAM);
    const subscription = new CatchUpSubscription(
      [TEST_STREAM],
      consumer,
      es,
      [queue]
    )

    const queueFinished = queue.push(newEvents);
    await subscription.startProcessing();
    const failedMessages = await queueFinished;

    expect(failedMessages.length).toEqual(0);
    expect(processedEvents).toEqual([
      'Old Event 1',
      'Old Event 2',
      'Old Event 3',
      'New Event 1',
      'New Event 2',
      'New Event 3',
    ])
  })

  it('uses metadata matcher from initializer to filter old events', async () => {
    await es.appendTo(TEST_STREAM, [
      makeTestEvent({
        name: 'Filter 1',
        meta: {'filter': true}
      }),
      makeTestEvent({
        name: 'Filter 2',
        meta: {'filter': true}
      })
    ]);

    const processedEvents: string[] = [];

    const consumer = async (evt: Event): Promise<boolean> => {
      processedEvents.push(evt.name);
      return true;
    }

    const initializers: SubscriptionInitializerMap = {};
    initializers[TEST_STREAM] = async () => {
      return [undefined, {'filter': {op: MatchOperator.EQ, val: true}}]
    }

    const queue = new LambdaBatchHandlerQueue(TEST_STREAM);
    const subscription = new CatchUpSubscription(
      [TEST_STREAM],
      consumer,
      es,
      [queue],
      initializers
    )

    const queueFinished = queue.push(newEvents);
    await subscription.startProcessing();
    const failedMessages = await queueFinished;
    expect(failedMessages.length).toEqual(0);
    expect(processedEvents).toEqual([
      'Filter 1',
      'Filter 2',
      'New Event 1',
      'New Event 2',
      'New Event 3',
    ])
  })

  it('uses fromEventId from initializer to start after last processed event', async () => {
    const fromEventId = randomUUID();
    await es.appendTo(TEST_STREAM, [
      makeTestEvent({
        name: 'FromEventId 1',
        meta: {'fromEventId': true}
      }),
      makeTestEvent({
        uuid: fromEventId,
        name: 'FromEventId 2',
        meta: {'fromEventId': true}
      }),
      makeTestEvent({
        name: 'FromEventId 3',
        meta: {'fromEventId': true}
      })
    ]);

    const processedEvents: string[] = [];

    const consumer = async (evt: Event): Promise<boolean> => {
      processedEvents.push(evt.name);
      return true;
    }

    const initializers: SubscriptionInitializerMap = {};
    initializers[TEST_STREAM] = async () => {
      return [fromEventId, {'fromEventId': {op: MatchOperator.EQ, val: true}}]
    }

    const queue = new LambdaBatchHandlerQueue(TEST_STREAM);
    const subscription = new CatchUpSubscription(
      [TEST_STREAM],
      consumer,
      es,
      [queue],
      initializers
    )

    const queueFinished = queue.push(newEvents);
    await subscription.startProcessing();
    const failedMessages = await queueFinished;
    expect(failedMessages.length).toEqual(0);
    expect(processedEvents).toEqual([
      'FromEventId 3',
      'New Event 1',
      'New Event 2',
      'New Event 3',
    ])
  })
})
