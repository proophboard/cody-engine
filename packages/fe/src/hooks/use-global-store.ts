import {GlobalStoreContext, Store} from "@frontend/app/providers/GlobalStore";
import {useContext} from "react";

export const useGlobalStore = (): [Store, (store: Store) => void] => {
  const ctx = useContext(GlobalStoreContext);

  return [ctx.globalStore, ctx.setGlobalStore];
}
