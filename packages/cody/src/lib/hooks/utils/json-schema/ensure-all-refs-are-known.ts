import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {JSONSchema7} from "json-schema-to-ts";
import {requireUncachedTypes} from "../value-object/require-uncached-types";
import {isRefSchema} from "./ref-schema";
import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";
import {FQCNFromDefinitionId} from "../value-object/definitions";
import {isListSchema} from "./list-schema";
import {isObjectSchema} from "./is-object-schema";
import {isCodyError} from "@proophboard/cody-utils";
import {splitPropertyRef} from "@event-engine/messaging/resolve-refs";

export const ensureAllRefsAreKnown = (node: Node, schema: JSONSchema7, types?: TypeRegistry): boolean | CodyResponse => {
  if(!types) {
    types = requireUncachedTypes();
  }

  if(isRefSchema(schema)) {
    const [ref, property] = splitPropertyRef(schema.$ref);
    const FQCN = FQCNFromDefinitionId(ref);

    if(!types[FQCN]) {
      return {
        cody: `Schema of ${node.getType()} "${node.getName()}" contains an unknown reference: "${ref}".`,
        type: CodyResponseType.Error,
        details: `Either it is a typo in the reference or you have to tell me about the referenced information first! I cannot find its qualified name "${FQCN}" in the types registry (@app/shared/types)`,
      }
    }

    if(property) {
      const type = types[FQCN];

      if(!isObjectSchema(type.schema)) {
        return {
          cody: `Schema of ${node.getType()} "${node.getName()}" contains an unknown reference: "${schema.$ref}".`,
          type: CodyResponseType.Error,
          details: `You referenced the property "${property}", but the referenced schema "${ref}" is not an object, so it does not have properties.`,
        }
      }

      if(!type.schema.properties || !type.schema.properties[property]) {
        return {
          cody: `Schema of ${node.getType()} "${node.getName()}" contains an unknown reference: "${schema.$ref}".`,
          type: CodyResponseType.Error,
          details: `You referenced the property "${property}", but the referenced schema "${ref}" does not have this property. Is it a typo?`,
        }
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
