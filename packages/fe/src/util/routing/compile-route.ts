import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {Logger} from "@frontend/util/Logger";
import {generatePath} from "react-router-dom";

export const compileRouteIfPossible = (page: PageDefinition, params?: Record<string, string>): string | undefined => {
  try {
    return generatePath(page.route, params);
  } catch (e) {
    return undefined;
  }
}
