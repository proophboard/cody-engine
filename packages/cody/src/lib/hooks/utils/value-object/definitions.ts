import {JSONSchema} from "json-schema-to-ts";
import {names} from "@event-engine/messaging/helpers";
import {Context} from "../../context";
import {CodyResponse, Node} from "@proophboard/cody-types";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {namespaceToFilePath, namespaceToJSONPointer} from "./namespace";
import {ValueObjectMetadata} from "@cody-engine/cody/hooks/utils/value-object/types";
import {isPropertyRef, splitPropertyRef} from "@event-engine/messaging/resolve-refs";

export const definitionId = (vo: Node, ns: string, ctx: Context): string | CodyResponse => {
  const service = detectService(vo, ctx);
  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const voNames = names(vo.getName());
  let nsFilename = namespaceToFilePath(ns);


  return `/definitions/${serviceNames.fileName}${nsFilename}${voNames.fileName}`;
}

export const voFQCN = (vo: Node, voMeta: ValueObjectMetadata, ctx: Context): string | CodyResponse => {
  const service = detectService(vo, ctx);
  if(isCodyError(service)) {
    return service;
  }

  const nsJsonPointer = namespaceToJSONPointer(voMeta.ns);

  return `${names(service).className}${nsJsonPointer}${names(vo.getName()).className}`;
}

export const FQCNFromDefinitionId = (definitionId: string): string => {
  const withoutPrefix = definitionId.replace('/definitions/', '');

  const fqcnParts = withoutPrefix.split("/");

  return fqcnParts.map(p => names(p).className).join(".");
}

export const splitVOFQCN = (fqcn: string): [string, string, string] => {
  const service = voServiceFromFQCN(fqcn);
  const nsJSONPointer = voNamespaceJSONPointerFromFQCN(fqcn);
  const className = voClassNameFromFQCN(fqcn);

  return [service, nsJSONPointer, className];
}

export const voClassNameFromFQCN = (fqcn: string): string => {
  const parts = fqcn.split(".");
  return names(parts[parts.length - 1]).className;
}

export const voServiceFromFQCN = (fqcn: string): string => {
  const parts = fqcn.split(".");
  return names(parts[0]).className;
}

export const voNamespaceJSONPointerFromFQCN = (fqcn: string): string => {
  const parts = fqcn.split(".");

  if(parts.length < 3) {
    return '';
  }

  const nsParts = parts.slice(1, -1);

  return nsParts.map(p => names(p).className).join(".");
}

export const normalizeRefs = (schema: JSONSchema, service: string): JSONSchema => {
  return visitRef(schema, ref => {
    const isPropRef = isPropertyRef(ref);
    const [refWithoutProp, prop] = isPropRef ? splitPropertyRef(ref) : [ref, ''];

    const refParts = refWithoutProp.split("/");
    if(refParts.length === 0) {
      return ref;
    }

    if(refParts[0] === "#" || refParts[0] === "") {
      refParts.shift();
    }

    // index 0 should be "definitions" now and 1 the service, if not add service part
    if(refParts.length < 2) {
      return names(refParts[0]).fileName;
    }

    const serviceNames = names(service);

    if(refParts[1] !== serviceNames.fileName) {
      refParts.splice(1, 0, serviceNames.fileName);
    }

    return '/' + refParts.map(p => names(p).fileName).join('/') + (isPropRef? ':'+prop : '');
  })
}

export const removeRefHash = (schema: JSONSchema): JSONSchema => {
  // Needed for json-schema-to-ts reference resolution, which fails on leading # in references
  return replaceRef(schema, '#/definitions', '/definitions');
}

export const addRefHash = (schema: JSONSchema): JSONSchema => {
  return replaceRef(schema, '/definitions', '#/definitions');
}

const replaceRef = (schema: JSONSchema, search: string, replace: string): JSONSchema => {
  return visitRef(schema, (ref) => ref.replace(search, replace));
}

const visitRef = (schema: JSONSchema, visitor: (ref: string) => string): JSONSchema => {
  const internalSchema: any = schema;

  if(internalSchema['$id']) {
    internalSchema['$id'] = visitor(internalSchema['$id']);
  }

  if(internalSchema['$ref']) {
    internalSchema['$ref'] = visitor(internalSchema['$ref']);
  }

  if(internalSchema['properties']) {
    for (const prop in internalSchema['properties']) {
      internalSchema['properties'][prop] = visitRef(internalSchema['properties'][prop], visitor);
    }
  }

  if(internalSchema['items']) {
    internalSchema['items'] = visitRef(internalSchema['items'] as JSONSchema, visitor);
  }

  return internalSchema as JSONSchema;
}
