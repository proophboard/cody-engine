export const registryIdToDataReference = (registryId: string): string => {
  return "/" + registryId.split(".").slice(1).join("/");
}
