export const removeLastPartFromRouteIfStatic = (route: string): string => {
  const parts = route.split("/");

  if(!parts[parts.length-1].startsWith(":")) {
    parts.pop();
  }

  return parts.join("/");
}
