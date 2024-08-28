import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "@cody-engine/cody/hooks/context";
import {voFQCN} from "@cody-engine/cody/hooks/utils/value-object/definitions";
import {getVoMetadata} from "@cody-engine/cody/hooks/utils/value-object/get-vo-metadata";
import {isCodyError, nodeNameToPascalCase} from "@proophboard/cody-utils";
import {detectService} from "@cody-engine/cody/hooks/utils/detect-service";
import {names} from "@event-engine/messaging/helpers";

export const nodeFQCN = (node: Node, ctx: Context): string | CodyResponse => {
  switch (node.getType()) {
    case NodeType.document:
      const voMeta = getVoMetadata(node, ctx);
      if(isCodyError(voMeta)) {
        return voMeta;
      }
      return voFQCN(node, voMeta, ctx);
    case NodeType.command:
      const service = detectService(node, ctx);
      const cmdName = nodeNameToPascalCase(node);

      if(isCodyError(service)) {
        return service;
      }

      return `${names(service).className}.${cmdName}`;
    default:
      return {
        cody: `Can't determine node FQCN for "${node.getName()}". The logic is not implemented :(`,
        details: "Please contact the prooph board team!",
        type: CodyResponseType.Error
      }
  }
}
