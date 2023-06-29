import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {Rule} from "../rule-engine/configuration";
import {parseJsonMetadata} from "@proophboard/cody-utils";

export interface DynamicBreadcrumbMetadata {
  data: string;
  label: Rule[] | string;
}

export interface UiMetadata {
  route?: string;
  routeParams?: string[];
  sidebar?: {label?: string; icon?: string; show?: boolean | Rule[]};
  breadcrumb?: string | DynamicBreadcrumbMetadata;
}

export const isDynamicBreadcrumb = (breadcrumb: string | DynamicBreadcrumbMetadata | undefined): breadcrumb is DynamicBreadcrumbMetadata => {
  if(!breadcrumb || typeof breadcrumb === "string") {
    return false;
  }

  if(breadcrumb.data && breadcrumb.label) {
    return true
  }

  return false;
}

export const getUiMetadata = (ui: Node, ctx: Context): UiMetadata | CodyResponse => {
  // @todo: validate ui meta
  return parseJsonMetadata(ui);
}
