export const getRouteParamsFromRoute = (route: string): string[] => {
  const parts = route.split("/");

  return parts.filter(p => p.startsWith(":")).map(p => p.replace("?", ""));
}
