import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {AlwaysRule} from "../rule-engine/configuration";
import {names} from "@event-engine/messaging/helpers";

export const alwaysMapPayload = (event: Node, aggregateState: Node, ctx: Context): AlwaysRule | CodyResponse => {
  const aggregateStateNames = names(aggregateState.getName());

  return {
    rule: "always",
    then: {
      assign: {
        variable: aggregateStateNames.propertyName,
        value: {
          "$merge": [`${aggregateStateNames.propertyName}`, 'event'],
        }
      }
    }
  }
}
