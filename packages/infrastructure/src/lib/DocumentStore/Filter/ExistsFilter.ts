import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class ExistsFilter implements Filter {
  public readonly prop: string;

  constructor(prop: string) {
    this.prop = prop;
  }

  processWith(processor: FilterProcessor): any {
    return processor.processExistsFilter(this);
  }
}
