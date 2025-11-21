import { Filter } from '../Filter';
import { FilterProcessor } from '@event-engine/infrastructure/DocumentStore/FilterProcessor';

export class ArrayIntersectFilter implements Filter {
  public readonly prop: string;
  public readonly valList: any[];
  public readonly collection: string;

  constructor(prop: string, valList: any[], collection = 'local') {
    this.prop = prop;
    this.valList = valList;
    this.collection = collection;
  }

  processWith(processor: FilterProcessor): any {
    return processor.processArrayIntersectFilter(this);
  }
}
