export const mapProperties = (source: Record<string, any>, mapping: Record<string, string>): Record<string, any> => {
  const mappedPayload: Record<string, any> = {};

  Object.keys(source).forEach(key => {
    const mappedKey = mapping && mapping[key]? mapping[key] : key;

    if((source)[key]) {
      mappedPayload[mappedKey] = (source)[key];
    }
  })

  return mappedPayload;
}
