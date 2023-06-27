import {Payload} from "@event-engine/messaging/message";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";

export const determineQueryPayload = <P extends Payload>(payload: Record<string, any>, queryRuntimeInfo: QueryRuntimeInfo, mapping?: Record<string, string>): P => {
  const schema = queryRuntimeInfo.schema;

  if(schema.properties) {
    const cleanedPayload: Record<string, any> = {};
    Object.keys(schema.properties).forEach(key => {

      if((payload as P)[key]) {
        const mappedKey = mapping && mapping[key]? mapping[key] : key;
        cleanedPayload[mappedKey] = (payload as P)[key];
      }
    })
    payload = cleanedPayload;
  }

  return payload as P;
}
