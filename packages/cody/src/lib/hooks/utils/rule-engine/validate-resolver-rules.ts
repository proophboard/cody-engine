import {
  isAssignVariable,
  isCountInformation, isExecuteRules,
  isFindInformation, isForEach, isThrowError,
  Rule
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {visitRulesThen} from "@cody-engine/cody/hooks/utils/rule-engine/visit-rule-then";

export const validateResolverRules = (rules: Rule[]): void => {
  visitRulesThen(rules, then => {
    switch (true) {
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
