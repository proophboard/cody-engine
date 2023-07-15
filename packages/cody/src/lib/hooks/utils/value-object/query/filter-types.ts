
export type Filter = AndFilter | OrFilter | NotFilter | AnyFilter | AnyOfDocIdFilter | AnyOfFilter | DocIdFilter | EqFilter |
                     ExistsFilter | GteFilter | GtFilter | InArrayFilter | LikeFilter | LteFilter | LtFilter;

export interface AndFilter {
  and: Filter[]
}

export const isAndFilter = (filter: any): filter is AndFilter => {
  return typeof filter.and !== "undefined"
}

export interface OrFilter {
  or: Filter[]
}

export const isOrFilter = (filter: any): filter is OrFilter => {
  return typeof filter.or !== "undefined"
}

export interface NotFilter {
  not: Filter
}

export const isNotFilter = (filter: any): filter is NotFilter => {
  return typeof filter.not !== "undefined";
}

export interface AnyFilter {
  any: boolean
}

export const isAnyFilter = (filter: any): filter is AnyFilter => {
  return typeof filter.any !== "undefined";
}

export interface AnyOfDocIdFilter {
  anyOfDocId: string;
}

export const isAnyOfDocIdFilter = (filter: any): filter is AnyOfDocIdFilter => {
  return typeof filter.anyOfDocId !== "undefined";
}

export interface AnyOfFilter {
  anyOf: {
    prop: string,
    valueList: string,
  }
}

export const isAnyOfFilter = (filter: any): filter is AnyOfFilter => {
  return typeof filter.anyOf !== "undefined";
}

export interface DocIdFilter {
  docId: string;
}

export const isDocIdFilter = (filter: any): filter is DocIdFilter => {
  return typeof filter.docId !== "undefined";
}

export interface EqFilter {
  eq: {
    prop: string,
    value: string,
  }
}

export const isEqFilter = (filter: any): filter is EqFilter => {
  return typeof filter.eq !== "undefined";
}

export interface ExistsFilter {
  exists: {
    prop: string;
  }
}

export const isExistsFilter = (filter: any): filter is ExistsFilter => {
  return typeof filter.exists !== "undefined";
}

export interface GteFilter {
  gte: {
    prop: string,
    value: string,
  }
}

export const isGteFilter = (filter: any): filter is GteFilter => {
  return typeof filter.gte !== "undefined";
}

export interface GtFilter {
  gt: {
    prop: string,
    value: string,
  }
}

export const isGtFilter = (filter: any): filter is GtFilter => {
  return typeof filter.gt !== "undefined";
}

export interface InArrayFilter {
  inArray: {
    prop: string,
    value: string,
  }
}

export const isInArrayFilter = (filter: any): filter is InArrayFilter => {
  return typeof filter.inArray !== "undefined";
}

export interface LikeFilter {
  like: {
    prop: string,
    value: string,
  }
}

export const isLikeFilter = (filter: any): filter is LikeFilter => {
  return typeof filter.like !== "undefined";
}

export interface LteFilter {
  lte: {
    prop: string,
    value: string,
  }
}

export const isLteFilter = (filter: any): filter is LteFilter => {
  return typeof filter.lte !== "undefined";
}

export interface LtFilter {
  lt: {
    prop: string,
    value: string,
  }
}

export const isLtFilter = (filter: any): filter is LtFilter => {
  return typeof filter.lt !== "undefined";
}



