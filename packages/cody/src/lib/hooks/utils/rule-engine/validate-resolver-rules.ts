import {
  isAssignVariable, isCallService,
  isCountInformation, isExecuteRules,
  isFindInformation, isForEach, isLookupUser, isLookupUsers, isThrowError,
  Rule
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {visitRulesThen} from "@cody-engine/cody/hooks/utils/rule-engine/visit-rule-then";

export const validateResolverRules = (rules: Rule[]): void => {
  visitRulesThen(rules, then => {
    switch (true) {
      case isCallService(then):
      case isLookupUsers(then):
      case isLookupUser(then):
      case isFindInformation(then):
      case isCountInformation(then):
      case isAssignVariable(then):
      case isForEach(then):
      case isExecuteRules(then):
      case isThrowError(then):
        return then;
      default:
        throw new Error(`Rule ${JSON.stringify(then)} is not allowed in a query resolver`);
    }
  });
}
