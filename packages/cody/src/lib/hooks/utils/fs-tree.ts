import {FsTree} from "nx/src/generators/tree";

export const listChangesForCodyResponse = (tree: FsTree): string => {
  return tree.listChanges().map(change => `${change.type} ${change.path}`).join("\n");
}
