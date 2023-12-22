import {Event} from "@event-engine/messaging/event";
import {Command} from "@event-engine/messaging/command";
import {AggregateRepository} from "@event-engine/infrastructure/AggregateRepository";
import {Payload} from "@event-engine/messaging/message";

export type ProcessingFunction<C extends Payload = any, E extends Payload = any, S = any> = (currentState: S, command: Command<C>) => AsyncGenerator<Event<E>>;
export type ProcessingFunctionWithDeps<C extends Payload = any, E extends Payload = any, S = any, D = any> = (currentState: S, command: Command<C>, dependencies: D) => AsyncGenerator<Event<E>>;
export type CommandHandlerRegistry = {[commandName: string]: ProcessingFunction | ProcessingFunctionWithDeps};
const getAggregateId = (p: Payload, aggregateIdentifier: string): string => {
    if(!p[aggregateIdentifier]) {
        throw new Error(`Payload is missing aggregate identifier: ${aggregateIdentifier}`)
    }

    return p[aggregateIdentifier];
}

export async function handle<C extends Payload = any, E extends Payload = any, S extends {} = any, D = any>(
    command: Command<C>,
    process: ProcessingFunction<C, E, S> | ProcessingFunctionWithDeps<C, E, S, D>,
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
