import {EnvContext, RuntimeEnvironment} from "@frontend/app/providers/UseEnvironment";
import {useContext} from "react";

export const useEnv = (): RuntimeEnvironment => {
  const env = useContext(EnvContext);

  return env.env;
}
