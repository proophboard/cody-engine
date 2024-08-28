import React, {PropsWithChildren} from "react";

export type RuntimeEnvironment = {UI_ENV: 'play' | 'dev' | 'test' | 'prod'};

const env: RuntimeEnvironment = {UI_ENV: 'dev'};

interface OwnProps {
  env: RuntimeEnvironment;
}

type EnvProviderProps = OwnProps & PropsWithChildren;

export const EnvContext = React.createContext({env});

const EnvProvider = (props: EnvProviderProps) => {
  return <EnvContext.Provider value={{env: props.env}}>
    {props.children}
  </EnvContext.Provider>
}

export default EnvProvider;
