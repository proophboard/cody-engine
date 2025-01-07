import {
  isAssignVariable,
  isCallService,
  isCountInformation,
  isExecuteRules,
  isFindInformation,
  isFindInformationById,
  isFindOneInformation, isFindOnePartialInformation, isFindPartialInformation, isFindPartialInformationById,
  isForEach,
  isLogMessage,
  isLookupUser,
  isLookupUsers,
  isThrowError,
  Rule
} from "@app/shared/rule-engine/configuration";
import {visitRulesThen} from "@cody-engine/cody/hooks/rule-engine/visit-rule-then";

export const validateResolverRules = (rules: Rule[]): void => {
  visitRulesThen(rules, then => {
    switch (true) {
      case isCallService(then):
      case isLookupUsers(then):
      case isLookupUser(then):
      case isFindInformation(then):
      case isFindInformationById(then):
      case isFindOneInformation(then):
      case isFindPartialInformation(then):
      case isFindOnePartialInformation(then):
      case isFindPartialInformationById(then):
      case isCountInformation(then):
      case isAssignVariable(then):
      case isForEach(then):
      case isExecuteRules(then):
      case isThrowError(then):
      case isLogMessage(then):
        return then;
      default:
        throw new Error(`Rule ${JSON.stringify(then)} is not allowed in a query resolver`);
    }
  });
}
