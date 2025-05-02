import React, {PropsWithChildren, useState} from "react";
import {RuntimeEnvironment} from "@frontend/app/providers/runtime-environment";

let env: RuntimeEnvironment = {UI_ENV: 'dev', DEFAULT_SERVICE: 'App', PAGES: {}};
let directSetEnvEnabled = false;
let isInitialized = false;

export const enableDirectSetEnv = () => {
  directSetEnvEnabled = true;
}

export const directSetEnv = (newEnv: RuntimeEnvironment) => {
  if(!directSetEnvEnabled) {
    console.warn("[Cody Engine] Set env directly is not enabled. Call has no effect.");
    return;
  }

  console.log("[Cody Engine] Set env directly: ", newEnv);
  isInitialized = true;
  env = newEnv;
}

interface OwnProps {
  env: RuntimeEnvironment;
}

type EnvProviderProps = OwnProps & PropsWithChildren;

export const EnvContext = React.createContext({env, setEnv: directSetEnv});

const EnvProvider = (props: EnvProviderProps) => {
  const [version, setVersion] = useState(1);

  if(!isInitialized) {
    env = props.env;
    isInitialized = true;
  }

  return <EnvContext.Provider value={{env, setEnv: (newEnv: RuntimeEnvironment) => {
      console.log("[Cody Engine] Change env via context hook: ", newEnv)
      env = newEnv;
      setVersion(version + 1)
    }}}>
    {props.children}
  </EnvContext.Provider>
}

export default EnvProvider;
