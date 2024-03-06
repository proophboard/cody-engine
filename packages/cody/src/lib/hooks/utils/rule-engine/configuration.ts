import {Filter} from "../value-object/query/filter-types";
import {SortOrder} from "@event-engine/infrastructure/DocumentStore";

export type RuleType = 'always' | 'condition';

export type AnyRule = AlwaysRule | ConditionRule;

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

export type ThenType = ThenRecordEvent | ThenThrowError | ThenAssignVariable | ThenTriggerCommand | ThenCallService | ThenExecuteRules | ThenForEach
  | ThenFilter | ThenFindInformation | ThenCountInformation | ThenInsertInformation | ThenUpsertInformation | ThenUpdateInformation | ThenReplaceInformation | ThenDeleteInformation
  | ThenLookupUsers | ThenLookupUser;

export type PropMapping = {[name: string]: string | string[]};

export interface ThenFilter {
  filter: Filter;
}

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

export const isFilter = (then: any): then is ThenFilter => typeof then.filter !== "undefined";

export interface ThenFindInformation {
  find: {
    information: string;
    filter: Filter;
    skip?: number;
    limit?: number;
    orderBy?: SortOrder;
    variable?: string;
  }
}

export const isFindInformation = (then: any): then is ThenFindInformation => typeof then.find !== "undefined";

export interface ThenLookupUsers {
  lookup: {
    users: {
      filter: Filter,
      skip?: number;
      limit?: number;
      orderBy?: SortOrder;
      variable?: string;
    }
  }
}

export const isLookupUsers = (then: any): then is ThenLookupUsers => typeof then.lookup === "object" && typeof then.lookup.users !== "undefined";

export interface ThenLookupUser {
  lookup: {
    user: string,
    variable?: string,
  }
}

export const isLookupUser = (then: any): then is ThenLookupUser => typeof then.lookup === "object" && typeof then.lookup.user !== "undefined";

export interface ThenCountInformation {
  count: {
    information: string;
    filter: Filter;
    variable?: string;
  }
}

export const isCountInformation = (then: any): then is ThenCountInformation => typeof then.count !== "undefined";

export interface ThenInsertInformation {
  insert: {
    information: string;
    id: string;
    set: string | PropMapping;
    meta?: string | PropMapping;
    version?: number;
  }
}

export const isInsertInformation = (then: any): then is ThenInsertInformation => typeof then.insert !== 'undefined';

export interface ThenUpsertInformation {
  upsert: {
    information: string;
    id: string;
    set: string | PropMapping;
    meta?: string | PropMapping;
    version?: number;
  }
}

export const isUpsertInformation = (then: any): then is ThenUpsertInformation => typeof then.upsert !== 'undefined';

export interface ThenUpdateInformation {
  update: {
    information: string;
    filter: Filter;
    set: string | PropMapping;
    meta?: string | PropMapping;
    version?: number;
  }
}

export const isUpdateInformation = (then: any): then is ThenUpdateInformation => typeof then.update !== 'undefined';

export interface ThenReplaceInformation {
  replace: {
    information: string;
    filter: Filter;
    set: string | PropMapping;
    meta?: string | PropMapping;
    version?: number;
  }
}

export const isReplaceInformation = (then: any): then is ThenReplaceInformation => typeof then.replace !== 'undefined';

export interface ThenDeleteInformation {
  delete: {
    information: string;
    filter: Filter;
  }
}

export const isDeleteInformation = (then: any): then is ThenDeleteInformation => typeof then.delete !== 'undefined';

export interface ThenExecuteRules {
  execute: {
    rules: Rule[]
  }
}

export const isExecuteRules = (then: any): then is ThenExecuteRules => typeof then.execute !== 'undefined';


