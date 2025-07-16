export const getParentRouteOfParam = (param: string, route: string): string => {
  const parts = route.split("/");

  const paramIndex = parts.findIndex(p => p === `:${param}`);

  return parts.slice(0, paramIndex).join("/");
}
