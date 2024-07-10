import {
  EventMatcher,
  MatchOperator,
  META_KEY_CREATED_AT,
  META_KEY_EVENT_ID,
  META_KEY_EVENT_NAME
} from "@event-engine/infrastructure/EventStore";
import {cloneDeep} from "lodash";

export const normalizeEventMetadataMatcher = (pbEventMatcher: EventMatcher): EventMatcher => {
  pbEventMatcher = cloneDeep(pbEventMatcher);

  for(const prop in pbEventMatcher) {
    let matchObject = pbEventMatcher[prop];

    if(Array.isArray(matchObject) || typeof matchObject !== "object") {
      if(![META_KEY_EVENT_ID, META_KEY_EVENT_NAME, META_KEY_CREATED_AT].includes(prop)) {
        matchObject = {
          op: MatchOperator.EQ,
          val: matchObject,
          evtProp: "payload"
        }
      }
    } else {
      if(!matchObject.evtProp) {
        matchObject.evtProp = "payload";
      }
    }

    pbEventMatcher[prop] = matchObject;
  }

  return pbEventMatcher;
}
