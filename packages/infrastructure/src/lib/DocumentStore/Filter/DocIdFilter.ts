import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class DocIdFilter implements Filter {
  public readonly val: any;

  constructor(val: any) {
    this.val = val;
  }

  processWith(processor: FilterProcessor): any {
    return processor.processDocIdFilter(this);
  }
}
