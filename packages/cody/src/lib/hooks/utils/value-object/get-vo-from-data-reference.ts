import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {getVoFromSyncedNodes} from "./get-vo-from-synced-nodes";

export const getVOFromDataReference = (data: string, refNode: Node, ctx: Context): Node | CodyResponse => {
  data = data.replace(".", "/");

  if(data[0] === "/") {
    data = data.slice(1);
  }

  const parts = data.split("/");

  if(parts.length < 3) {
    const service = detectService(refNode, ctx);

    if(isCodyError(service)) {
      return service;
    }

    const serviceClassName = names(service).className;
    const firstPart = names(parts[0]).className;

    if(firstPart !== serviceClassName) {
      parts.unshift(serviceClassName);
    }
  }

  data = parts.map(p => names(p).className).join(".");

  return getVoFromSyncedNodes(data, ctx);
}
