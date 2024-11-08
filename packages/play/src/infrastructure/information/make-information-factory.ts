import {Rule} from "@app/shared/rule-engine/configuration";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {cloneDeep} from "lodash";

export const makeInformationFactory = (rules: Rule[]): (data: any) => any => {
  return (data: any): any => {
    data = cloneDeep(data);

    const ctx = {data};

    const exe = makeSyncExecutable(rules);

    const result = exe(ctx);

    return result.data;
  }
}
