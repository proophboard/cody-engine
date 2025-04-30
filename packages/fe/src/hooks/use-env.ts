import {EnvContext} from "@frontend/app/providers/UseEnvironment";
import {useContext} from "react";
import {RuntimeEnvironment} from "@frontend/app/providers/runtime-environment";

export const useEnv = (): RuntimeEnvironment => {
  const env = useContext(EnvContext);

  return env.env;
}
