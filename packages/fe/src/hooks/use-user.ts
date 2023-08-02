import {User} from "@app/shared/types/core/user/user";
import {useContext} from "react";
import {UserContext} from "@frontend/app/providers/User";
import {environment} from "@frontend/environments/environment";
import {setPrototypePersonaHeader} from "@frontend/extensions/http/configured-axios";

export const useUser = (): [User, (user: User) => void] => {
  const ctx = useContext(UserContext);

  const handleSetUser = (user: User) => {
    ctx.setUser(user);
    if(environment.mode === "prototype") {
      setPrototypePersonaHeader(user);
    }
  }

  return [ctx.user, handleSetUser];
}
