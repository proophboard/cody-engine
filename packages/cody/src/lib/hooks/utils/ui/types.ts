import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";

export interface DynamicBreadcrumbMetadata {
  data: string;
  label: Rule[] | string;
}

export interface UiMetadata {
  route?: string;
  routeParams?: string[];
  sidebar?: { label?: string; icon?: string; show?: boolean | Rule[], invisible?: string };
  breadcrumb?: string | DynamicBreadcrumbMetadata;
}

export const isDynamicBreadcrumb = (breadcrumb: string | DynamicBreadcrumbMetadata | undefined): breadcrumb is DynamicBreadcrumbMetadata => {
  if (!breadcrumb || typeof breadcrumb === "string") {
    return false;
  }

  if (breadcrumb.data && breadcrumb.label) {
    return true
  }

  return false;
}
