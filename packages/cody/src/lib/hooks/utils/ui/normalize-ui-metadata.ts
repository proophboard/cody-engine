import {RawUiMetadata, UiMetadata} from "@cody-engine/cody/hooks/utils/ui/types";
import {names} from "@event-engine/messaging/helpers";

export const normalizeUiMetadata = (meta: RawUiMetadata): UiMetadata => {
  if(meta && meta.tab) {

    if(typeof meta.tab.hidden === "boolean") {
      meta.tab.hidden = meta.tab.hidden? 'true':'false';
    }

    if(meta.tab["hidden:expr"]) {
      meta.tab.hidden = meta.tab["hidden:expr"];
      delete meta.tab["hidden:expr"];
    }

    if(typeof meta.tab.disabled === "boolean") {
      meta.tab.disabled = meta.tab.disabled? 'true' : 'false';
    }

    if(meta.tab["disabled:expr"]) {
      meta.tab.disabled = meta.tab["disabled:expr"];
      delete meta.tab["disabled:expr"];
    }

    if(meta.tab["style:expr"]) {
      meta.tab.styleExpr = meta.tab["style:expr"];
      delete meta.tab["style:expr"];
    }

    if(meta.tab.icon) {
      meta.tab.icon = names(meta.tab.icon).className;
    }
  }

  if(meta && meta.sidebar) {
    if(meta.sidebar.icon) {
      meta.sidebar.icon = names(meta.sidebar.icon).className;
    }

    if(typeof meta.sidebar.hidden === "boolean") {
      meta.sidebar.invisible = meta.sidebar.hidden ? 'true' : 'false';
      delete meta.sidebar.hidden;
    } else if (typeof meta.sidebar.hidden === "string") {
      meta.sidebar.invisible = meta.sidebar.hidden;
      delete meta.sidebar.hidden;
    }

    if(typeof meta.sidebar['hidden:expr'] === "string") {
      meta.sidebar.invisible = meta.sidebar['hidden:expr'];
      delete meta.sidebar["hidden:expr"];
    }

    if(typeof meta.sidebar.position === "undefined") {
      meta.sidebar.position = 5;
    }
  }

  if(meta.route && !meta.routeParams) {
    const params = detectRouteParams(meta.route);

    if(params.length) {
      meta.routeParams = params;
    }
  }

  return meta;
}

const detectRouteParams = (route: string): string[] => {
  return route.split("/").filter(p => p.indexOf(":") === 0).map(p => p.slice(1));
}
