import {
  AnyRule, isExecuteRules, isForEach,
  isIfConditionRule,
  isIfNotConditionRule, isRecordEvent,
  ThenType
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {names} from "@event-engine/messaging/helpers";

export const normalizeThenRecordEventRules = (aggregate: string, rules: AnyRule[]): AnyRule[] => {
  return rules.map(r => normalizeRule(aggregate, r));
}

const normalizeRule = (aggregate: string, rule: AnyRule): AnyRule => {
  const clonedRule = {...rule};
  if(isIfConditionRule(rule) || isIfNotConditionRule(rule)) {
    if(rule.else && (isIfConditionRule(clonedRule) || isIfNotConditionRule(clonedRule))) {
      clonedRule.else = normalizeThen(aggregate, rule.else);
    }
  }
  clonedRule.then = normalizeThen(aggregate, rule.then);

  return clonedRule;
}

const normalizeThen = (aggregate: string, then: ThenType): ThenType => {
  if(isExecuteRules(then)) {
    return {execute: {rules: normalizeThenRecordEventRules(aggregate, then.execute.rules)}};
  }

  if(isForEach(then)) {
    return {forEach: {then: normalizeThen(aggregate, then.forEach.then), variable: then.forEach.variable}};
  }

  if(isRecordEvent(then)) {
    return {record: {event: aggregate + '.' + names(then.record.event).className, mapping: then.record.mapping}};
  }

  return then;
}
