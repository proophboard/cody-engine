import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";

export const playParseJsonMetadata = <T>(node: Node): T | CodyResponse => {
  const meta = getStringMetadata(node);

  if(playIsCodyError(meta)) {
    return meta;
  }

  try {
    return JSON.parse(meta);
  } catch (e) {
    return {
      cody: `I was not able to parse metadata of "${node.getName()}". It's not valid JSON, is it?`,
      details: (e instanceof Error)? e.toString() : e as string,
      type: CodyResponseType.Error
    }
  }
}

export const getStringMetadata = (node: Node): string | CodyResponse => {
  if(node.getMetadata() === null) {
    return {
      cody: `Element "${node.getName()}" is missing metadata. Can't proceed without it!`,
      type: CodyResponseType.Error
    }
  }

  return node.getMetadata() as string;
}
