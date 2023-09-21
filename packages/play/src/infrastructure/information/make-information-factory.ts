import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";

export const makeInformationFactory = (rules: Rule[]): (data: any) => any => {
  return (data: any): any => {
    const ctx = {data};

    const exe = makeSyncExecutable(rules);

    const result = exe(ctx);

    return result.data;
  }
}
