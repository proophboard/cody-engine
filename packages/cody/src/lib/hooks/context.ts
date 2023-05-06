import {Map} from "immutable";
import {Node} from "@proophboard/cody-types";

export interface Context {
  syncedNodes: Map<string, Node>,
  beSrc: string,
  feSrc: string,
  sharedSrc: string,
  projectRoot: string,
}
