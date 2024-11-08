import {Filter} from "../Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class AnyOfDocIdFilter implements Filter {
    public readonly valList: any[];
    public readonly collection: string;

    constructor(valList: any[], collection = 'local') {
        this.valList = valList;
        this.collection = collection;
    }

    processWith(processor: FilterProcessor): any {
      return processor.processAnyOfDocIdFilter(this);
    }
}
