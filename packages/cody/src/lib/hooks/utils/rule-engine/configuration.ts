import {JSONSchema7} from "json-schema-to-ts";
import {Filter} from "../value-object/query/filter-types";

export type RuleType = 'always' | 'condition' | 'validate';

export interface Rule {
  rule: RuleType;
  then: ThenType;
}

export type AlwaysRule = Rule

export type ConditionRule = IfConditionRule | IfNotConditionRule;

export interface IfConditionRule extends Rule {
  if: string;
  else?: ThenType;
  stop?: boolean;
}

export const isIfConditionRule = (rule: any): rule is IfConditionRule => {
  return typeof rule.if !== "undefined";
}

export interface IfNotConditionRule extends Rule {
  if_not: string;
  else?: ThenType;
  stop?: boolean;
}

export const isIfNotConditionRule = (rule: any): rule is IfNotConditionRule => {
  return typeof rule.if_not !== "undefined";
}

export interface ValidateRule extends Rule {
  validate: JSONSchema7;
}

export type ThenType = ThenRecordEvent | ThenThrowError | ThenAssignVariable | ThenTriggerCommand | ThenCallService | ThenFetchData | ThenExecuteRules | ThenForEach | ThenFilter;

export type PropMapping = {[name: string]: string | string[]};

export interface ThenFilter {
  filter: Filter;
}

export const isFilter = (then: any): then is ThenFilter => typeof then.filter !== "undefined";

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
    arguments?: string | PropMapping;
    method?: string;
    async?: boolean;
    result: {
      variable: string;
      mapping?: string | PropMapping;
    }
  }
}

export const isCallService = (then: any): then is ThenCallService => typeof then.call !== 'undefined';

export interface ThenFetchData {
  fetch: {
    query: string;
    mapping?: string | PropMapping;
    result: {
      variable: string;
      mapping?: string | PropMapping;
    }
  }
}

export const isFetchData = (then: any): then is ThenFetchData => typeof then.fetch !== 'undefined';

export interface ThenExecuteRules {
  execute: {
    rules: Rule[]
  }
}

export const isExecuteRules = (then: any): then is ThenExecuteRules => typeof then.execute !== 'undefined';
