import {Rule} from "@app/shared/rule-engine/configuration";
import {ApplyFunction} from "@server/infrastructure/AggregateRepository";
import {makeAsyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {cleanUndefinedProperties, enforceUndefinedProperties} from "@event-engine/messaging/message";

export const makeEventReducer = (rules: Rule[], config: CodyPlayConfig): ApplyFunction<any> => {
  return async (state: any, event ): Promise<any> => {
      const eventRuntimeInfo = config.events[event.name];

      const eventSchema = eventRuntimeInfo.schema || {};

      const ctx = {
        information: state,
        event: enforceUndefinedProperties(event.payload, eventSchema),
        meta: event.meta,
        eventCreatedAt: event.createdAt
      };

      const exe = makeAsyncExecutable(rules);

      const result = await exe(ctx);

      return cleanUndefinedProperties(result.information);
  }
}
