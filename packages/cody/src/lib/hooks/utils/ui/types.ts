import {Rule} from "@app/shared/rule-engine/configuration";
import {SxProps} from "@mui/material";
import {DynamicSidebar, Tab, TopLevelGroup} from "@frontend/app/pages/page-definitions";

export interface DynamicBreadcrumbMetadata {
  data: string;
  label: Rule[] | string;
}

export type ViewComponent = string | { view: string, hidden: boolean}

export interface UiMetadata {
  route?: string;
  routeParams?: string[];
  sidebar?: { label?: string; icon?: string; show?: boolean | Rule[], invisible?: string, position: number, dynamic?: DynamicSidebar, group?: TopLevelGroup };
  breadcrumb?: string | DynamicBreadcrumbMetadata;
  tab?: Tab;
  commands?: string[];
  views?: ViewComponent[];
}

export type RawUiMetadata = UiMetadata & {
  sidebar?: {hidden?: string | boolean, 'hidden:expr'?: string},
  tab?: {hidden?: string | boolean, 'hidden:expr'?: string, disabled?: string | boolean, 'disabled:expr'?: string, 'style:expr'?: string}
};

export const isDynamicBreadcrumb = (breadcrumb: string | DynamicBreadcrumbMetadata | undefined): breadcrumb is DynamicBreadcrumbMetadata => {
  if (!breadcrumb || typeof breadcrumb === "string") {
    return false;
  }

  if (breadcrumb.data && breadcrumb.label) {
    return true
  }

  return false;
}
