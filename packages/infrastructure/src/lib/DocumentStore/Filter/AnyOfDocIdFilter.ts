import {Filter} from "../Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class AnyOfDocIdFilter implements Filter {
    public readonly valList: any[];

    constructor(valList: any[]) {
        this.valList = valList;
    }

    processWith(processor: FilterProcessor): any {
      return processor.processAnyOfDocIdFilter(this);
    }
}
