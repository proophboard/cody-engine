import React, {PropsWithChildren, useState} from "react";
import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";

const EmptyTypes: TypeRegistry = {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {
  types?: TypeRegistry;
}

type TypesProviderProps = OwnProps & PropsWithChildren;

export const TypesContext = React.createContext({
  types: EmptyTypes,
  setTypes: (types: TypeRegistry) => { /* do nothing */ }
});

const TypesProvider = (props: TypesProviderProps) => {
  const [types, setTypes] = useState(props.types || EmptyTypes);

  return <TypesContext.Provider value={{types, setTypes}}>
    {props.children}
  </TypesContext.Provider>
}

export default TypesProvider;

