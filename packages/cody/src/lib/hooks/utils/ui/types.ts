import {AnyRule, PropMapping, Rule} from "@app/shared/rule-engine/configuration";
import {DynamicSidebar, PageType, Tab, TopLevelGroup} from "@frontend/app/pages/page-definitions";
import {UiSchema} from "@rjsf/utils";
import {Action} from "@frontend/app/components/core/form/types/action";

export interface DynamicBreadcrumbMetadata {
  data: string;
  label: Rule[] | string;
}

export type ViewComponentType = 'auto' | 'state' | 'form' | 'table';

export type ViewComponent = string | {
  view: string,
  hidden?: boolean,
  'hidden:expr'?: string,
  props?: Record<string, unknown>,
  uiSchema?: UiSchema,
  type?: ViewComponentType,
  loadState?: boolean,
  data?: string | string[] | PropMapping | PropMapping[];
}

export type CommandComponent = string | Action;

export interface UiMetadata {
  route?: string;
  routeParams?: string[];
  sidebar?: { label?: string; 'label:t'?: string; icon?: string; show?: boolean | Rule[], invisible?: string, position: number, dynamic?: DynamicSidebar, group?: TopLevelGroup };
  breadcrumb?: string | DynamicBreadcrumbMetadata;
  'breadcrumb:t'?: string;
  tab?: Tab;
  commands?: CommandComponent[];
  views?: ViewComponent[];
  type?: PageType;
  mainPage?: string;
  title?: string;
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
