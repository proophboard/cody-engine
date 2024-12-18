import {Map} from "immutable";
import {Node} from "@proophboard/cody-types";
import {FsTree} from "nx/src/generators/tree";

export interface Context {
  syncedNodes: Map<string, Node>,
  beSrc: string,
  feSrc: string,
  sharedSrc: string,
  projectRoot: string,
  boardId: string,
  boardName: string,
  userId: string,
  tree: () => FsTree,
  service?: string,
  codeGeneration: {
    be: {
      businessLogic: boolean;
      eventApplyLogic: boolean;
      policyLogic: boolean;
      resolverLogic: boolean;
    },
    fe: {
      reactHooks: boolean;
      reactComponents: boolean;
      pages: boolean;
    }
  }
}
