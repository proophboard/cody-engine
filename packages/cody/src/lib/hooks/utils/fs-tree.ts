import {FsTree} from "nx/src/generators/tree";

export const listChangesForCodyResponse = (tree: FsTree): string => {
  return tree.listChanges().map(change => `${change.type} ${change.path}`).join("\n");
}

export const isNewFile = (path: string, tree: FsTree): boolean => {
  if(!tree.exists(path)) {
    return true;
  }

  let isNewFile = false;

  tree.listChanges().forEach(c => {
    if(c.path === path && c.type === "CREATE") {
      isNewFile = true;
    }
  });

  return isNewFile;
}

export const requireUncached = (module: string) => {
  delete require.cache[require.resolve(module)];
  return require(module);
}
