import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {AlwaysRule} from "../rule-engine/configuration";
import {names} from "@event-engine/messaging/helpers";

export const alwaysMapPayload = (event: Node, aggregateState: Node, ctx: Context): AlwaysRule | CodyResponse => {
  return {
    rule: "always",
    then: {
      assign: {
        variable: 'information',
        value: {
          "$merge": [`information`, 'event'],
        }
      }
    }
  }
}
