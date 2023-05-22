import {names} from "@event-engine/messaging/helpers";
import {FsTree} from "nx/src/generators/tree";
import {Context} from "../../context";

const prepareNs = (ns: string): string => {
  if(ns.length === 0) {
    return ns;
  }

  if(ns[0] !== "/") {
    ns = `/${ns};`
  }

  if(ns[ns.length - 1] !== "/") {
    ns += "/";
  }

  ns = ns.slice(1, -1);

  return ns;
}

export const namespaceToJSONPointer = (ns: string): string => {
  if(ns.length === 0) {
    return ns;
  }

  ns = prepareNs(ns);

  return ns.split("/").join(".");
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

