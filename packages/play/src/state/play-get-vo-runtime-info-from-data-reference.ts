import {PlayInformationRegistry, PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {names} from "@event-engine/messaging/helpers";

export const playGetVoRuntimeInfoFromDataReference = (data: string, refNodeService: string, types: PlayInformationRegistry): PlayInformationRuntimeInfo => {
  data = data.replace(".", "/");

  if(data[0] === "/") {
    data = data.slice(1);
  }

  const parts = data.split("/");

  if(parts.length < 3) {
    const firstPart = names(parts[0]).className;

    if(firstPart !== refNodeService) {
      parts.unshift(refNodeService);
    }
  }

  data = parts.map(p => names(p).className).join(".");

  const type = types[data];

  if(!type) {
    throw new Error(`Cannot find Information "${data}". Did you forget to pass the corresponding Information card to Cody?`);
  }

  return type;
}
