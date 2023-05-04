import {Filter} from "../Filter";
import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";

export class AnyFilter implements Filter {
    processWith(processor: FilterProcessor): any {
      return processor.processAnyFilter(this);
    }
}
