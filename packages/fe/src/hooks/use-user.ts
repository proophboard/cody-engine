import {User} from "@app/shared/types/core/user/user";
import {useContext} from "react";
import {UserContext} from "@frontend/app/providers/User";

export const useUser = (): [User, (user: User) => void] => {
  const ctx = useContext(UserContext);

  return [ctx.user, ctx.setUser];
}
