import {LambdaBatchHandlerQueue, LambdaMessage} from "@event-engine/infrastructure/Queue/LambdaBatchHandlerQueue";
import {randomUUID} from "crypto";
import {makeTestEvent} from "@event-engine/infrastructure/helpers.spec";

describe('LambdaBatchHandlerQueue', () => {
  it('processes lambda messages', async () => {
    const messages: LambdaMessage[] = [];

    for (let i = 0; i < 3;  i++) {
      messages.push({
        messageId: randomUUID(),
        event: makeTestEvent()
      })
    }

    const queue = new LambdaBatchHandlerQueue('test_stream');
    let processedMessages = 0;

    queue.attachConsumer(evt => new Promise(r => {
      processedMessages++;
      r(true)
    }));

    const failedMessages = await queue.push(messages);

    expect(failedMessages.length).toBe(0);
    expect(processedMessages).toBe(3);
  })

  it('returns failed messages', async () => {
    const messages: LambdaMessage[] = [];

    for (let i = 0; i < 3;  i++) {
      messages.push({
        messageId: randomUUID(),
        event: makeTestEvent()
      })
    }

    const queue = new LambdaBatchHandlerQueue('test_stream');
    let processedMessages = 0;

    queue.attachConsumer(evt => new Promise(r => {
      processedMessages++;
      r(processedMessages < 2)
    }));

    const failedMessages = await queue.push(messages);

    expect(failedMessages.length).toBe(2);
    expect(processedMessages).toBe(3);
  })

  it('stops after first failed message in FIFO mode', async () => {
    const messages: LambdaMessage[] = [];

    for (let i = 0; i < 3;  i++) {
      messages.push({
        messageId: randomUUID(),
        event: makeTestEvent()
      })
    }

    const queue = new LambdaBatchHandlerQueue('test_stream', true);
    let processedMessages = 0;

    queue.attachConsumer(evt => new Promise(r => {
      processedMessages++;
      r(processedMessages < 2)
    }));

    const failedMessages = await queue.push(messages);

    expect(failedMessages.length).toBe(2);
    expect(processedMessages).toBe(2);
  })
})
