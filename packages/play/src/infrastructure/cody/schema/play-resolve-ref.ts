import {RefSchema} from "@cody-engine/cody/hooks/utils/json-schema/ref-schema";
import {JSONSchema7} from "json-schema-to-ts";
import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {PlayInformationRegistry, PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {names} from "@event-engine/messaging/helpers";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";

export const playResolveRef = (schema: RefSchema, parentSchema: JSONSchema7, node: Node, types: PlayInformationRegistry): PlayInformationRuntimeInfo | CodyResponse => {
  const ref = playFQCNFromDefinitionId(schema['$ref'])

  if(!types[ref]) {
    return {
      cody: `I'm trying to find the referenced Value Object: "${ref}", but it is not registered in the type registry (@app/shared/types)`,
      type: CodyResponseType.Error,
      details: `First check if it is a typo in the JSON Schema: "${JSON.stringify(parentSchema)}" of card: "${node.getName()}". If not, you maybe forgot to tell me about the referenced Value Object? That might be the reason why it is not in the type registry. If both is not true, it seems you hit a bug. Please contact the prooph board team!`
    }
  }

  return types[ref];
}
