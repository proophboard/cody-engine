import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";
import {requireUncached} from "../fs-tree";

export const requireUncachedTypes = (): TypeRegistry => {
  requireUncached('@app/shared/types/definitions');
  requireUncached('@app/shared/types/references');
  const {types} = requireUncached('@app/shared/types');

  return types;
}
