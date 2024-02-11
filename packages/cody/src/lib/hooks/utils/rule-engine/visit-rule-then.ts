import {
  isExecuteRules, isForEach,
  isIfConditionRule,
  isIfNotConditionRule, isRecordEvent,
  Rule,
  ThenType
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {names} from "@event-engine/messaging/helpers";
import {normalizeThenRecordEventRules} from "@cody-play/infrastructure/rule-engine/normalize-then-record-event-rules";

type Visitor = (then: ThenType) => ThenType;
export const visitRulesThen = (rules: Rule[], visitor: Visitor): Rule[] => {
  return rules.map(rule => visitRuleThen(rule, visitor));
}

export const visitRuleThen = (rule: Rule, visitor: Visitor): Rule => {
  const clonedRule = {...rule};
  if(isIfConditionRule(rule) || isIfNotConditionRule(rule)) {
    if(rule.else && (isIfConditionRule(clonedRule) || isIfNotConditionRule(clonedRule))) {
      clonedRule.else = visitThen(rule.else, visitor);
    }
  }
  clonedRule.then = visitThen(rule.then, visitor);

  return clonedRule;
}

const visitThen = (then: ThenType, visitor: Visitor): ThenType => {
  then = visitor(then);

  if(isExecuteRules(then)) {
    return {execute: {rules: visitRulesThen(then.execute.rules, visitor)}};
  }

  if(isForEach(then)) {
    return {forEach: {then: visitThen(then.forEach.then, visitor), variable: then.forEach.variable}};
  }

  return then;
}
