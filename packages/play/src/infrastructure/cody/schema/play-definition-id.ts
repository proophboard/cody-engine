import {CodyResponse, Node} from "@proophboard/cody-types";
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";
import {names} from "@event-engine/messaging/helpers";
import {namespaceToFilePath, namespaceToJSONPointer} from "@cody-engine/cody/hooks/utils/value-object/namespace";
import {playService} from "@cody-play/infrastructure/cody/service/play-service";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {PlayValueObjectMetadata} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";

export const playDefinitionId = (vo: Node, ns: string, ctx: ElementEditedContext): string | CodyResponse => {
  const service = playService(vo, ctx);
  if(playIsCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const voNames = names(vo.getName());
  const nsFilename = namespaceToFilePath(ns);


  return `/definitions/${serviceNames.fileName}${nsFilename}${voNames.fileName}`;
}

export const playVoFQCN = (vo: Node, voMeta: PlayValueObjectMetadata, ctx: ElementEditedContext): string | CodyResponse => {
  const service = playService(vo, ctx);
  if(playIsCodyError(service)) {
    return service;
  }

  const nsJsonPointer = namespaceToJSONPointer(voMeta.ns);

  return `${names(service).className}${nsJsonPointer}${names(vo.getName()).className}`;
}

export const playFQCNFromDefinitionId = (definitionId: string): string => {
  const withoutPrefix = definitionId.replace('/definitions/', '');

  const fqcnParts = withoutPrefix.split("/");

  return fqcnParts.map(p => names(p).className).join(".");
}

export const playDefinitionIdFromFQCN = (fqcn: string): string => {
  return '/definitions/' + fqcn
    .split(".")
    .map(r => names(r).fileName)
    .join("/");
}
