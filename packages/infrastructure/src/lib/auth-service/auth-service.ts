import {SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";

export interface AuthUser {
  displayName: string;
  userId: string;
  email: string;
  avatar?: string;
  roles: string[];
  attributes?: Record<string, unknown>;
}

export type UnregisteredUser = Omit<AuthUser, 'userId'>;

export type FindByProperty = "userId" | "role" | string;

export interface FindByArguments {
  filter: Record<FindByProperty, any>,
  skip?: number,
  limit?: number,
  orderBy?: SortOrder
}

export const SERVICE_NAME_AUTH_SERVICE = 'AuthService';

export interface AuthService {
  update: (user: AuthUser) => Promise<void>;
  register: (user: UnregisteredUser) => Promise<string>;
  tokenToUser: (token: unknown) => Promise<AuthUser>;
  get: (userId: string) => Promise<AuthUser>;
  find: (filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<AuthUser[]>;
  findBy: (by: FindByArguments) => Promise<AuthUser[]>;
  findOneBy: (by: FindByArguments) => Promise<AuthUser|undefined>;
}

export const convertFindByFilter = (filter: Record<FindByProperty, any>): Filter => {
  const filterCount = Object.keys(filter).length;

  if(filterCount === 0) {
    return new AnyFilter();
  }

  if(filterCount === 1) {
    return toFilter(Object.keys(filter)[0], Object.values(filter)[0])
  }

  const and: Filter[] = [];

  for (const filterKey in filter) {
    and.push(toFilter(filterKey, filter[filterKey]));
  }

  return new AndFilter(and[0], and[1], ...and.slice(2));
}

const toFilter = (prop: FindByProperty, val: any): Filter => {
  if(prop === "userId") {
    return new EqFilter('userId', val);
  }

  if(prop === "role") {
    return new InArrayFilter('roles', val);
  }

  return new EqFilter(`attributes.${prop}`, val);
}
