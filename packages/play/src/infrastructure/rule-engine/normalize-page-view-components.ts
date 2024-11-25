import {ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";

export const normalizePageViewComponents = (viewComponents: ViewComponent[], defaultService: string): ViewComponent[] => {
  return viewComponents.map(vc => {
    if(typeof vc === "object") {
      return {
        ...vc,
        view: normalizeName(vc.view, defaultService)
      }
    }

    return normalizeName(vc, defaultService);
  })
}

const normalizeName = (name: string, defaultService: string): string => {
  if(name.split(".").length === 1) {
    return `${defaultService}.${name}`;
  }

  return name;
}
