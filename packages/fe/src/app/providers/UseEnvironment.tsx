import React, {PropsWithChildren, useEffect, useState} from "react";

export type RuntimeEnvironment = {UI_ENV: 'play' | 'dev' | 'test' | 'prod', DEFAULT_SERVICE: string};

const env: RuntimeEnvironment = {UI_ENV: 'dev', DEFAULT_SERVICE: 'App'};

interface OwnProps {
  env: RuntimeEnvironment;
}

type EnvProviderProps = OwnProps & PropsWithChildren;

export const EnvContext = React.createContext({env, setEnv: (newEnv: RuntimeEnvironment) => {}});

const EnvProvider = (props: EnvProviderProps) => {
  const [env, setEnv] = useState<RuntimeEnvironment>(props.env);

  return <EnvContext.Provider value={{env, setEnv}}>
    {props.children}
  </EnvContext.Provider>
}

export default EnvProvider;
