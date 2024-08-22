import * as React from 'react';
import {PropsWithChildren, useState} from "react";
import {isEqual, cloneDeep} from "lodash";

export type Store = Record<string, any>;

const EmptyStore: Store = {};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface OwnProps {

}


type GlobalStoreProps = OwnProps & PropsWithChildren;

export const GlobalStoreContext = React.createContext({
  globalStore: EmptyStore,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setGlobalStore: (store: Store) => {}
})

const GlobalStore = (props: GlobalStoreProps) => {
   const [globalStore, setGlobalStore] = useState(EmptyStore);

   const replaceIfChanged = (newGlobalStore: Store) => {
     console.log("setting new global store", globalStore, newGlobalStore)
     if(!isEqual(newGlobalStore, globalStore)) {
       setGlobalStore(newGlobalStore);
     }
   }

   return <GlobalStoreContext.Provider value={{globalStore: cloneDeep(globalStore), setGlobalStore: replaceIfChanged}}>
     {props.children}
   </GlobalStoreContext.Provider>
};

export default GlobalStore;
