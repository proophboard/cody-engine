import {JSONSchema7} from "json-schema-to-ts";

export type RuleType = 'always' | 'condition' | 'validate';

export interface Rule {
  rule: RuleType;
  then: ThenType;
}

export interface AlwaysRule extends Rule {

}

export type ConditionRule = IfConditionRule | IfNotConditionRule;

export interface IfConditionRule extends Rule {
  if: string;
  stop?: boolean;
}

export const isIfConditionRule = (rule: any): rule is IfConditionRule => {
  return typeof rule.if !== "undefined";
}

export interface IfNotConditionRule extends Rule {
  if_not: string;
  stop?: boolean;
}

export const isIfNotConditionRule = (rule: any): rule is IfNotConditionRule => {
  return typeof rule.if_not !== "undefined";
}

export interface ValidateRule extends Rule {
  validate: JSONSchema7;
}

export type ThenType = ThenRecordEvent | ThenThrowError | ThenAssignVariable | ThenTriggerCommand | ThenCallService | ThenPerformQuery | ThenExecuteRules | ThenForEach;

export type PropMapping = {[name: string]: string | string[]};

export interface ThenForEach {
  forEach: {
    variable: string;
    then: ThenType;
  }
}

export const isForEach = (then: any): then is ThenForEach => typeof then.forEach !== 'undefined';

export interface ThenRecordEvent {
  record: {
    event: string;
    mapping: string | PropMapping
  }
}

export const isRecordEvent = (then: any): then is ThenRecordEvent => typeof then.record !== 'undefined';

export interface ThenThrowError {
  throw: {
    error: string
  }
}

export const isThrowError = (then: any): then is ThenThrowError => typeof then.throw !== 'undefined';

export interface ThenAssignVariable {
  assign: {
    variable: string;
    value: string | PropMapping;
  }
}

export const isAssignVariable = (then: any): then is ThenAssignVariable => typeof then.assign !== 'undefined';

export interface ThenTriggerCommand {
  trigger: {
    command: string;
    mapping: string | PropMapping;
    meta?: string | PropMapping;
  }
}

export const isTriggerCommand = (then: any): then is ThenTriggerCommand => typeof then.trigger !== 'undefined';

export interface ThenCallService {
  call: {
    service: string;
    arguments: PropMapping;
    method?: string;
    result: {
      variable: string;
      mapping: string | PropMapping;
    }
  }
}

export const isCallService = (then: any): then is ThenCallService => typeof then.call !== 'undefined';

export interface ThenPerformQuery {
  perform: {
    query: string;
    mapping: string | PropMapping;
    result: {
      variable: string;
      mapping: string | PropMapping;
    }
  }
}

export const isPerformQuery = (then: any): then is ThenPerformQuery => typeof then.perform !== 'undefined';

export interface ThenExecuteRules {
  execute: {
    rules: Rule[]
  }
}

export const isExecuteRules = (then: any): then is ThenExecuteRules => typeof then.execute !== 'undefined';
