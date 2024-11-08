import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class DocIdFilter implements Filter {
  public readonly val: any;
  public readonly collection: string;

  constructor(val: any, collection = 'local') {
    this.val = val;
    this.collection = collection;
  }

  processWith(processor: FilterProcessor): any {
    return processor.processDocIdFilter(this);
  }
}
