import React, {PropsWithChildren, useEffect, useState} from "react";
import {PageRegistry} from "@frontend/app/pages";

export type RuntimeEnvironment = {UI_ENV: 'play' | 'dev' | 'test' | 'prod', DEFAULT_SERVICE: string, PAGES: PageRegistry};

let env: RuntimeEnvironment = {UI_ENV: 'dev', DEFAULT_SERVICE: 'App', PAGES: {}};

export const directSetEnv = (newEnv: RuntimeEnvironment) => {
  console.log("[Cody Engine] Set env directly: ", newEnv);
  env = newEnv;
}

interface OwnProps {
  env: RuntimeEnvironment;
}

type EnvProviderProps = OwnProps & PropsWithChildren;

export const EnvContext = React.createContext({env, setEnv: directSetEnv});

const EnvProvider = (props: EnvProviderProps) => {
  const [version, setVersion] = useState(1);

  return <EnvContext.Provider value={{env, setEnv: (newEnv: RuntimeEnvironment) => {
      console.log("[Cody Engine] Change env via context hook: ", newEnv)
      directSetEnv(newEnv);
      setVersion(version + 1)
    }}}>
    {props.children}
  </EnvContext.Provider>
}

export default EnvProvider;
