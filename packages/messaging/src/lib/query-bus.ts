import {Payload} from "@event-engine/messaging/message";
import {Query} from "@event-engine/messaging/query";
import {QueryDescription} from "@event-engine/descriptions/descriptions";

export interface QueryBus {
  dispatch: <S extends Payload = any>(query: Query, desc: QueryDescription) => Promise<S>;
}
