import {User} from "@app/shared/types/core/user/user";
import {SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";

export type UnregisteredUser = Omit<User, 'userId'>;

export interface FindByArguments {
  property: "userId" | "role" | string,
  value: any,
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
