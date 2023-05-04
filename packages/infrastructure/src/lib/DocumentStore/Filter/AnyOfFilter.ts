import {Filter} from "../Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class AnyOfFilter implements Filter {
    public readonly prop: string;
    public readonly valList: any[];

    constructor(prop: string, valList: any[]) {
        this.prop = prop;
        this.valList = valList;
    }

    processWith(processor: FilterProcessor): any {
      return processor.processAnyOfFilter(this);
    }
}
