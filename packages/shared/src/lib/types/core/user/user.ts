import {UserRole} from "@app/shared/types/core/user/user-role";

interface UserProps {
  displayName: string;
  userId: string;
  email: string;
  avatar?: string;
  roles: UserRole[];
  attributes?: Record<string, unknown>;
}

export type User = Readonly<UserProps>;
