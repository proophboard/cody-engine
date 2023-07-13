import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {JSONSchema7} from "json-schema-to-ts";
import {requireUncachedTypes} from "../value-object/require-uncached-types";
import {isRefSchema} from "./ref-schema";
import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";
import {FQCNFromDefinitionId} from "../value-object/definitions";
import {isListSchema} from "./list-schema";
import {isObjectSchema} from "./is-object-schema";
import {isCodyError} from "@proophboard/cody-utils";

export const ensureAllRefsAreKnown = (node: Node, schema: JSONSchema7, types?: TypeRegistry): boolean | CodyResponse => {
  if(!types) {
    types = requireUncachedTypes();
  }

  if(isRefSchema(schema)) {
    const FQCN = FQCNFromDefinitionId(schema.$ref);

    if(!types[FQCN]) {
      return {
        cody: `Schema of ${node.getType()} "${node.getName()}" contains an unknown reference: "${schema.$ref}".`,
        type: CodyResponseType.Error,
        details: `Either it is a typo in the reference or you have to tell me about the referenced information first! I cannot find its qualified name "${FQCN}" in the types registry (@app/shared/types)`,
      }
    }

    return true;
  }

  if(isListSchema(schema)) {
    return ensureAllRefsAreKnown(node, schema.items, types);
  }

  if(isObjectSchema(schema)) {
    for (const prop in schema.properties) {
      const result = ensureAllRefsAreKnown(node, schema.properties[prop], types);

      if(isCodyError(result)) {
        return result;
      }
    }
  }

  return true;
}
