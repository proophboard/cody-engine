import {Filter} from "../Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class OrFilter implements Filter {
    public readonly internalFilters: Filter[];

    constructor(aFilter: Filter, bFilter: Filter, ...otherFilters: Filter[]) {
        this.internalFilters = [aFilter, bFilter, ...otherFilters];
    }

    processWith(processor: FilterProcessor): any {
        return processor.processOrFilter(this);
    }
}
