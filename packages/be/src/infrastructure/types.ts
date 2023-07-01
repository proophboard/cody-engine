import {getConfiguredCommandBus} from "@server/infrastructure/configuredCommandBus";
import {getConfiguredEventBus} from "@server/infrastructure/configuredEventBus";
import {getConfiguredQueryBus} from "@server/infrastructure/configuredQueryBus";

export type CommandBus = ReturnType<typeof getConfiguredCommandBus>;
export type EventBus = ReturnType<typeof getConfiguredEventBus>;
export type QueryBus = ReturnType<typeof getConfiguredQueryBus>;
