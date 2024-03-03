import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {SxProps} from "@mui/material";
import {Tab} from "@frontend/app/pages/page-definitions";

export interface DynamicBreadcrumbMetadata {
  data: string;
  label: Rule[] | string;
}

export interface UiMetadata {
  route?: string;
  routeParams?: string[];
  sidebar?: { label?: string; icon?: string; show?: boolean | Rule[], invisible?: string, position: number };
  breadcrumb?: string | DynamicBreadcrumbMetadata;
  tab?: Tab;
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
