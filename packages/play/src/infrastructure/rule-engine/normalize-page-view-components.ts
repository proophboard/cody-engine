import {ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {normalizeServerUiSchema} from "@frontend/util/schema/normalize-ui-schema";

export const normalizePageViewComponents = (viewComponents: ViewComponent[], defaultService: string): ViewComponent[] => {
  return viewComponents.map(vc => {
    if(typeof vc === "object") {
      const uiSchema = vc.uiSchema ? normalizeServerUiSchema(vc.uiSchema, defaultService) : undefined;
      return {
        ...vc,
        uiSchema,
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
