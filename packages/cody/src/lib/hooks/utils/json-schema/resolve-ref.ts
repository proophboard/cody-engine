import {RefSchema} from "./ref-schema";
import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {names} from "@event-engine/messaging/helpers";
import {JSONSchema7} from "json-schema-to-ts";
import {requireUncachedTypes} from "../value-object/require-uncached-types";

export const resolveRef = (schema: RefSchema, parentSchema: JSONSchema7, node: Node): ValueObjectRuntimeInfo | CodyResponse => {
  const types = requireUncachedTypes();

  const ref = schema['$ref'].replace('/definitions/', '')
    .split("/")
    .map(r => names(r).className)
    .join(".");

  if(!types[ref]) {
    return {
      cody: `I'm trying to find the referenced Value Object: "${ref}", but it is not registered in the type registry (@app/shared/types)`,
      type: CodyResponseType.Error,
      details: `First check if it is a typo in the JSON Schema: "${JSON.stringify(parentSchema)}" of card: "${node.getName()}". If not, you maybe forgot to tell me about the referenced Value Object? That might be the reason why it is not in the type registry. If both is not true, it seems you hit a bug. Please contact the prooph board team!`
    }
  }

  return types[ref];
}
