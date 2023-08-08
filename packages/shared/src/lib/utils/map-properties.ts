export const mapProperties = (source: Record<string, any>, mapping: Record<string, string>): Record<string, any> => {
  const mappedPayload: Record<string, any> = {};
  mapping = flipMapping(mapping);

  Object.keys(source).forEach(key => {
    const mappedKey = mapping && mapping[key]? mapping[key] : key;

    if((source)[key] && mappedKey !== "$not") {
      mappedPayload[mappedKey] = (source)[key];
    }
  })

  return mappedPayload;
}

const flipMapping = (mapping: Record<string, string>): Record<string, string> => {
  const flippedRecord: Record<string, string> = {};

  for (const mappingKey in mapping) {
    flippedRecord[mapping[mappingKey]] = mappingKey;
  }

  return flippedRecord;
}
