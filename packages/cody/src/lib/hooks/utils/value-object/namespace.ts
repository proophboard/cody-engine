import {names} from "@event-engine/messaging/helpers";

const prepareNs = (ns: string): string => {
  if(ns.length === 0) {
    return ns;
  }

  if(ns[0] !== "/") {
    ns = `/${ns}`;
  }

  if(ns[ns.length - 1] !== "/") {
    ns += "/";
  }

  ns = ns.slice(1, -1);

  return ns;
}

export const valueObjectNamespaceFromFQCN = (fqcn: string): string => {
  return prepareNs(fqcn.split(".").slice(1, -1).join("/"));
}

export const valueObjectNameFromFQCN = (fqcn: string): string => {
  return fqcn.split(".").pop() || '';
}

export const namespaceToJSONPointer = (ns: string): string => {
  ns = prepareNs(ns);

  if(ns.length === 0) {
    return '.';
  }

  return '.' + (ns.split("/").join(".")) + '.';
}

export const namespaceToFilePath = (ns: string): string => {
  ns = prepareNs(ns);

  if(ns === "") {
    return "/";
  }

  return '/' + ns.split("/").map(part => names(part).fileName).join("/") + '/';
}

export const namespaceToClassName = (ns: string): string => {
  ns = prepareNs(ns);

  return ns.split("/").map(part => names(part).className).join("");
}

export interface NamespaceNames {
  ns: string;
  className: string;
  fileName: string;
  JSONPointer: string;
}

export const namespaceNames = (ns: string): NamespaceNames => {
  return {
    ns,
    className: namespaceToClassName(ns),
    fileName: namespaceToFilePath(ns),
    JSONPointer: namespaceToJSONPointer(ns),
  }
}

