import {User} from "@app/shared/types/core/user/user";

export type UnregisteredUser = Omit<User, 'userId'>;

export interface AuthService {
  register: (user: UnregisteredUser) => Promise<string>;
}
