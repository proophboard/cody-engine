import {UserRole} from "@app/shared/types/core/user/user-role";
import {Persona} from "@app/shared/extensions/personas";

interface UserProps {
  displayName: string;
  userId: string;
  email: string;
  avatar?: string;
  roles: UserRole[];
  attributes?: Record<string, unknown>;
}

export type User = Readonly<UserProps>;

export const isPersona = (u: User | Persona): u is Persona => typeof (u as any).description !== "undefined";
