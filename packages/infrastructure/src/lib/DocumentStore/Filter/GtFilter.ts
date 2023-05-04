import {Filter} from "../Filter";
import {getValueFromPath} from "../helpers";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class GtFilter implements Filter {
    public readonly prop: string;
    public readonly val: any;

    constructor(prop: string, val: any) {
        this.prop = prop;
        this.val = val;
    }

    processWith(processor: FilterProcessor): any {
      return processor.processGtFilter(this);
    }
}
