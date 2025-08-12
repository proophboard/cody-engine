import {GlobalStoreContext, Store} from "@frontend/app/providers/GlobalStore";
import {useContext} from "react";

export const useGlobalStore = (): [Store, (store: Store) => void, (key: string, data: unknown) => void] => {
  const ctx = useContext(GlobalStoreContext);

  return [ctx.globalStore, ctx.setGlobalStore, ctx.setGlobalStoreKey];
}
