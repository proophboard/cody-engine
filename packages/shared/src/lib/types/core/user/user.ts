import {UserRole} from "@app/shared/types/core/user/user-role";

interface UserProps {
  displayName: string;
  userId: string;
  email: string;
  avatar?: string;
  roles: UserRole[],
}

export type User = Readonly<UserProps>;
