import {User} from "@app/shared/types/core/user/user";
import {SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";

export type UnregisteredUser = Omit<User, 'userId'>;

export type FindByProperty = "userId" | "role" | string;

export interface FindByArguments {
  filter: Record<FindByProperty, any>,
  skip?: number,
  limit?: number,
  orderBy?: SortOrder
}

export interface AuthService {
  register: (user: UnregisteredUser) => Promise<string>;
  get: (userId: string) => Promise<User>;
  find: (filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<User[]>;
  findBy: (by: FindByArguments) => Promise<User[]>;
  findOneBy: (by: FindByArguments) => Promise<User|undefined>;
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
