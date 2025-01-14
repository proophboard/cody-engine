import {DependencyRegistry} from "@event-engine/descriptions/descriptions";

export const normalizeDependencies = (deps: DependencyRegistry | undefined, defaultService:  string): DependencyRegistry | undefined => {
  if(!deps) {
    return undefined;
  }

  deps = {...deps};

  for (const depsKey in deps) {
    const dep = deps[depsKey];

    if(Array.isArray(dep)) {
      if(dep.length > 0) {
        const firstDep = dep[0];

        if(firstDep.type === "query"  && depsKey.split(".").length === 1) {
          delete deps[depsKey];

          const newKey = `${defaultService}.${depsKey}`;

          deps[newKey] = dep;
        }
      }
    } else {
      if(dep.type === "query" && depsKey.split(".").length === 1) {
        delete deps[depsKey];

        const newKey = `${defaultService}.${depsKey}`;

        deps[newKey] = dep;
      }
    }
  }

  return deps;
}
