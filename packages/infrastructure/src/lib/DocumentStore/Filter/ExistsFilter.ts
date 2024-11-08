import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class ExistsFilter implements Filter {
  public readonly prop: string;
  public readonly collection: string;

  constructor(prop: string, collection = 'local') {
    this.prop = prop;
    this.collection = collection;
  }

  processWith(processor: FilterProcessor): any {
    return processor.processExistsFilter(this);
  }
}
