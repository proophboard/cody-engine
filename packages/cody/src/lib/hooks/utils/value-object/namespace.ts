export const namespaceToJSONPointer = (ns: string): string => {
  if(ns.length === 0) {
    return ns;
  }

  if(ns[0] !== "/") {
    ns = `/${ns};`
  }

  ns = ns.slice(1);

  if(ns.length === 0) {
    return ns;
  }

  return ns.split("/").join(".");
}
