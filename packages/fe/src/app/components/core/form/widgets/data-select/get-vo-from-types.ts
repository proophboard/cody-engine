import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {names} from "@event-engine/messaging/helpers";
import {types} from "@app/shared/types";
import {JSONSchema7} from "json-schema-to-ts";
import {JSONSchemaWithId} from "@frontend/app/components/core/form/widgets/json-schema/json-schema-with-id";

export const getVOFromTypes = (refOrFQCN: string, rootSchema: JSONSchemaWithId): ValueObjectRuntimeInfo => {
  if(refOrFQCN[0] === "/") {
    const rootId = rootSchema.$id || '';
    const definitionIdParts = rootId.replace('/definitions/', '').split('/');
    const service = names(definitionIdParts[0] || '').className;
    refOrFQCN = (service + refOrFQCN).split("/").join(".");
  }

  if(!types[refOrFQCN]) {
    throw new Error(`DataSelect: Unknown type "${refOrFQCN}"`);
  }

  return types[refOrFQCN];
}
