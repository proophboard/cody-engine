import {Event} from "@event-engine/messaging/event";
import {Command} from "@event-engine/messaging/command";
import {AggregateRepository} from "@event-engine/infrastructure/AggregateRepository";
import {Payload} from "@event-engine/messaging/message";
import {StreamEventsRepository} from "@event-engine/infrastructure/StreamEventsRepository";
import jexl from '@app/shared/jexl/get-configured-jexl';
import {PureFactsRepository} from "@event-engine/infrastructure/PureFactsRepository";

export type ProcessingFunction<C extends Payload = any, E extends Payload = any> = (command: Command<C>) => AsyncGenerator<Event<E>>;
export type ProcessingFunctionWithDeps<C extends Payload = any, E extends Payload = any, D = any> = (command: Command<C>, dependencies: D) => AsyncGenerator<Event<E>>;
export type AggregateProcessingFunction<C extends Payload = any, E extends Payload = any, S = any> = (currentState: S, command: Command<C>) => AsyncGenerator<Event<E>>;
export type AggregateProcessingFunctionWithDeps<C extends Payload = any, E extends Payload = any, S = any, D = any> = (currentState: S, command: Command<C>, dependencies: D) => AsyncGenerator<Event<E>>;

export type CommandHandlerRegistry = {[commandName: string]: ProcessingFunction | ProcessingFunctionWithDeps | AggregateProcessingFunction | AggregateProcessingFunctionWithDeps};
const getAggregateId = (p: Payload, aggregateIdentifier: string): string => {
    if(!p[aggregateIdentifier]) {
        throw new Error(`Payload is missing aggregate identifier: ${aggregateIdentifier}`)
    }

    return p[aggregateIdentifier];
}

export async function handlePureCommand<C extends Payload = any, E extends Payload = any, D = any>(
  command: Command<C>,
  process: ProcessingFunction<C, E> | ProcessingFunctionWithDeps<C, E, D>,
  repository: PureFactsRepository,
  dependencies?: D
): Promise<boolean> {
    const events = [];
    let result: IteratorResult<Event<E>, Event<E>>;
    const processing = process(command, dependencies || ({} as D));

    // eslint-disable-next-line no-cond-assign
    while(result = await processing.next()) {
        if(!result.value) {
            break;
        }

        events.push(result.value);
    }

    return await repository.save(events, command);
}

export async function getStreamId<C extends Payload = any, D = any>(streamIdExpr: string, command: Command<C>, dependencies?: D): Promise<string> {
    const ctx: any = dependencies;
    ctx['command'] = command.payload;
    ctx['meta'] = command.meta;

    return await jexl.eval(streamIdExpr, ctx);
}

export async function handleStreamCommand<C extends Payload = any, E extends Payload = any, D = any>(
  command: Command<C>,
  streamId: string,
  process: ProcessingFunction<C, E> | ProcessingFunctionWithDeps<C, E, D>,
  repository: StreamEventsRepository,
  dependencies?: D
): Promise<boolean> {
    const expectedVersion = await repository.getCurrentStreamVersion(streamId);

    const events = [];
    let result: IteratorResult<Event<E>, Event<E>>;

    const processing = process(command, dependencies || ({} as D));

    // eslint-disable-next-line no-cond-assign
    while(result = await processing.next()) {
        if(!result.value) {
            break;
        }

        events.push(result.value);
    }

    return await repository.save(streamId, events, expectedVersion, command);
}

export async function handleAggregateCommand<C extends Payload = any, E extends Payload = any, S extends object = any, D = any>(
    command: Command<C>,
    process: AggregateProcessingFunction<C, E, S> | AggregateProcessingFunctionWithDeps<C, E, S, D>,
    repository: AggregateRepository<S>,
    newAggregate = false,
    dependencies?: D): Promise<boolean> {

    let state = {};
    let expectedVersion = 0;

    if(!newAggregate) {
        const aggregateId = getAggregateId(command.payload, repository.aggregateIdentifier);
        [state, expectedVersion] = await repository.loadState(aggregateId);
    }

    let currentVersion = expectedVersion;

    const events = [];
    let result: IteratorResult<Event<E>, Event<E>>;

    const processing = process(state as S, command, dependencies || ({} as D));

    // eslint-disable-next-line no-cond-assign
    while(result = await processing.next()) {
        if(!result.value) {
            break;
        }

        const event = result.value;

        [state, currentVersion] = await repository.applyEvents(state as S, currentVersion, [event]);

        events.push(event);
    }

    return await repository.save(events, state, expectedVersion, command);
}
