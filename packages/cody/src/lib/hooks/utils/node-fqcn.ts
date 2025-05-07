import {CodyResponse, Node, NodeName, NodeType} from "@proophboard/cody-types";
import {Context} from "@cody-engine/cody/hooks/context";
import {voFQCN} from "@cody-engine/cody/hooks/utils/value-object/definitions";
import {getVoMetadata} from "@cody-engine/cody/hooks/utils/value-object/get-vo-metadata";
import {isCodyError, nodeNameToPascalCase} from "@proophboard/cody-utils";
import {detectService} from "@cody-engine/cody/hooks/utils/detect-service";
import {names} from "@event-engine/messaging/helpers";

export const nodeNameFQCN = (nodeName: NodeName, defaultService: string): string => {
  const parts = nodeName.split(".");

  if(parts.length > 1) {
    return parts.map(p => names(p).className).join(".");
  }

  return `${names(defaultService).className}.${names(nodeName).className}`;
}

export const nodeServiceFromFQCN = (fqcn: string, defaultService: string): string => {
  return fqcn.split(".").shift() || defaultService;
}

export const nodeFQCN = (node: Node, ctx: Context): string | CodyResponse => {
  switch (node.getType()) {
    case NodeType.document:
      const voMeta = getVoMetadata(node, ctx);
      if(isCodyError(voMeta)) {
        return voMeta;
      }
      return voFQCN(node, voMeta, ctx);
    default:
      const service = detectService(node, ctx);
      const nodeName = nodeNameToPascalCase(node);

      if(isCodyError(service)) {
        return service;
      }

      return `${names(service).className}.${nodeName}`;
  }
}
