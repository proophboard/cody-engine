import {FilterProcessor} from "@event-engine/infrastructure/DocumentStore/FilterProcessor";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {OrFilter} from "@event-engine/infrastructure/DocumentStore/Filter/OrFilter";
import {DocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/DocIdFilter";
import {ExistsFilter} from "@event-engine/infrastructure/DocumentStore/Filter/ExistsFilter";
import {GtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GtFilter";
import {GteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GteFilter";
import {LtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LtFilter";
import {LteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LteFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";
import {LikeFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LikeFilter";
import {NotFilter} from "@event-engine/infrastructure/DocumentStore/Filter/NotFilter";
import {AnyOfDocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfDocIdFilter";
import {AnyOfFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfFilter";
import {getValueFromPath} from "@event-engine/infrastructure/DocumentStore/helpers";

type ReturnType = (doc: any, docId: string) => boolean;

export class InMemoryFilterProcessor implements FilterProcessor {

  process(filter: Filter): ReturnType {
    return filter.processWith(this);
  }

  processAnyFilter(filter: AnyFilter): ReturnType {
    return () => true;
  };

  processEqFilter(filter: EqFilter): ReturnType {
    return (doc: any) => getValueFromPath(filter.prop, doc) === filter.val;
  };

  processAndFilter(filter: AndFilter): ReturnType {
    return (doc: any, docId: string) => {
      const filterFunctions = filter.internalFilters.map(innerFilter => innerFilter.processWith(this));
      return filterFunctions.every(filterFunction => filterFunction(doc, docId));
    }
  };

  processOrFilter(filter: OrFilter): ReturnType {
    return (doc: any, docId: string) => {
      const filterFunctions = filter.internalFilters.map(innerFilter => innerFilter.processWith(this));
      return filterFunctions.some(filterFunction => filterFunction(doc, docId));
    }
  };

  processDocIdFilter(filter: DocIdFilter): ReturnType {
    return (doc: any, docId: string) => docId === filter.val;
  };

  processExistsFilter(filter: ExistsFilter): ReturnType {
    return (doc: any) => getValueFromPath(filter.prop, doc) !== undefined;
  }

  processGtFilter(filter: GtFilter): ReturnType {
    return (doc: any) => getValueFromPath(filter.prop, doc) > filter.val;
  }

  processGteFilter(filter: GteFilter): ReturnType {
    return (doc: any) => getValueFromPath(filter.prop, doc) >= filter.val;
  }

  processLtFilter(filter: LtFilter): ReturnType {
    return (doc: any) => getValueFromPath(filter.prop, doc) < filter.val;
  }

  processLteFilter(filter: LteFilter): ReturnType {
    return (doc: any) => getValueFromPath(filter.prop, doc) <= filter.val;
  }

  processInArrayFilter(filter: InArrayFilter): ReturnType {
    return (doc: any) => {
      const value = getValueFromPath(filter.prop, doc);
      return Array.isArray(value) && value.includes(filter.val);
    };
  }

  processLikeFilter(filter: LikeFilter): ReturnType {
    return (doc: any) => {
      const value = getValueFromPath(filter.prop, doc);

      if (typeof value !== 'string') {
        return false;
      }

      const start = filter.prop.startsWith('%') && value.endsWith(filter.prop.slice(1));
      const end = filter.prop.endsWith('%') && value.startsWith(filter.prop.slice(0, -1));
      return start && end;
    };
  }

  processNotFilter(filter: NotFilter): ReturnType {
    return (doc: any, docId: string) => {
      const filterFunction = filter.innerFilter.processWith(this);
      return !filterFunction(doc, docId);
    };
  }

  processAnyOfDocIdFilter(filter: AnyOfDocIdFilter): ReturnType {
    return (doc: any, docId: string) => filter.valList.includes(docId);
  }

  processAnyOfFilter(filter: AnyOfFilter): ReturnType {
    return (doc: any) => {
      const value = getValueFromPath(filter.prop, doc);
      return filter.valList.includes(value);
    };
  }
}
