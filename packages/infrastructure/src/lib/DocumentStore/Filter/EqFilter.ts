import {Filter} from "../Filter";
import {getValueFromPath} from "../helpers";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class EqFilter implements Filter {
    public readonly prop: string;
    public readonly val: any;
    public readonly collection: string;

    constructor(prop: string, val: any, collection = 'local') {
        this.prop = prop;
        this.val = val;
        this.collection = collection;
    }

    processWith(processor: FilterProcessor): any {
      return processor.processEqFilter(this);
    }
}
