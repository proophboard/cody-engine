import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {JSONSchema7} from "json-schema";
import {PlayInformationRegistry} from "@cody-play/state/types";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";
import {isListSchema, isObjectSchema} from "@cody-play/infrastructure/cody/schema/check";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {isRefSchema} from "@cody-play/infrastructure/json-schema/is-ref-schema";
import {splitPropertyRef} from "@event-engine/messaging/resolve-refs";

export const playEnsureAllRefsAreKnown = (node: Node, schema: JSONSchema7, types: PlayInformationRegistry): boolean | CodyResponse => {
  if(isRefSchema(schema)) {
    const FQCN = playFQCNFromDefinitionId(splitPropertyRef(schema.$ref)[0]);

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
    return playEnsureAllRefsAreKnown(node, schema.items, types);
  }

  if(isObjectSchema(schema)) {
    for (const prop in schema.properties) {
      const result = playEnsureAllRefsAreKnown(node, schema.properties[prop], types);

      if(playIsCodyError(result)) {
        return result;
      }
    }
  }

  return true;
}
