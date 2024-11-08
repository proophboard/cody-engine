import {Node} from "@proophboard/cody-types";
import {AlwaysRule, ThenRecordEvent} from "@app/shared/rule-engine/configuration";

export const alwaysRecordEvent = (event: Node): AlwaysRule => {
  return {
    rule: "always",
    then: {
      record: {
        event: event.getName(),
        mapping: "command"
      },
    } as ThenRecordEvent
  }
}
