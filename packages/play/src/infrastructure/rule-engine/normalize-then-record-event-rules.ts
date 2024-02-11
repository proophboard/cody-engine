import {
  AnyRule, isRecordEvent
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {names} from "@event-engine/messaging/helpers";
import {visitRulesThen} from "@cody-engine/cody/hooks/utils/rule-engine/visit-rule-then";

export const normalizeThenRecordEventRules = (aggregate: string, rules: AnyRule[]): AnyRule[] => {
  return visitRulesThen(rules, then => {
    if(isRecordEvent(then)) {
      return {record: {event: aggregate + '.' + names(then.record.event).className, mapping: then.record.mapping}};
    }

    return then;
  })
}
