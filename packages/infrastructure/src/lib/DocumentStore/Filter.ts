import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export interface Filter {
    processWith: (processor: FilterProcessor) => any;
}

