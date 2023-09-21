import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {ApplyFunction} from "@event-engine/infrastructure/AggregateRepository";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";

export const makeEventReducer = (rules: Rule[]): ApplyFunction<any> => {
  return async (state: any, event ): Promise<any> => {
      const ctx = {information: state, event: event.payload, meta: event.meta};

      const exe = makeAsyncExecutable(rules);

      const result = await exe(ctx);

      return result.information;
  }
}
