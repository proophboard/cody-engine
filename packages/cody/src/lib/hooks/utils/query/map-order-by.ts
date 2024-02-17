import {SortOrder, SortOrderItem} from "@event-engine/infrastructure/DocumentStore";

export const mapOrderBy = (orderBy: string | SortOrderItem | SortOrder ): SortOrder => {
  if(Array.isArray(orderBy)) {
    return orderBy.map(item => mapOrderByProp(item))
  }

  return [mapOrderByProp(orderBy)];
}

export const mapOrderByProp = (orderBy: SortOrderItem | string): SortOrderItem => {

  if(typeof orderBy === "string") {
    return {
      prop: `${orderBy}`,
      sort: 'asc'
    }
  }

  return {
    prop: `${orderBy.prop}`,
    sort: orderBy.sort
  }
}
