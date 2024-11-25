import {DependencyRegistry} from "@event-engine/descriptions/descriptions";

export const normalizeDependencies = (deps: DependencyRegistry | undefined, defaultService:  string): DependencyRegistry | undefined => {
  if(!deps) {
    return undefined;
  }

  deps = {...deps};

  for (const depsKey in deps) {
    const dep = deps[depsKey];

    if(dep.type === "query" && depsKey.split(".").length === 1) {
      delete deps[depsKey];

      const newKey = `${defaultService}.${depsKey}`;

      deps[newKey] = dep;
    }
  }

  return deps;
}
