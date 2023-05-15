import {JSONSchema7} from "json-schema-to-ts";

export type RuleType = 'always' | 'condition' | 'validate';

export interface Rule {
  rule: RuleType;
  then: Then;
  stop?: boolean;
}

export interface AlwaysRule extends Rule {

}

export interface IfConditionRule extends Rule {
  if: string;
}

export interface IfNotConditionRule extends Rule {
  if_not: string;
}

export interface ValidateRule extends Rule {
  validate: JSONSchema7;
}

export type ThenType = 'record_event' | 'throw_error' | 'assign_variable' | 'trigger_command' | 'perform_query';

export interface Then {
  do: ThenType;
}

export type PropMapping = {[name: string]: string};

export interface ThenRecordEvent extends Then {
  event: string;
  mapping: string | PropMapping
}

