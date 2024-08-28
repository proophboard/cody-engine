import {useContext} from "react";
import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";
import {TypesContext} from "@frontend/app/providers/Types";

export const useTypes = (): [TypeRegistry, (types: TypeRegistry) => void] => {
  const ctx = useContext(TypesContext);

  return [ctx.types, ctx.setTypes];
}
