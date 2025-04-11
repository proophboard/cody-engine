import {QueryClient} from "@tanstack/react-query";
import {SvgIcon, SxProps} from "@mui/material";
import {ProophBoardDescription} from "@event-engine/descriptions/descriptions";
import {CommandComponent, ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";

export type UnsubscribeBreadcrumbListener = () => void;
export type BreadcrumbFn = (params: Record<string, string>, queryClient: QueryClient, onLabelChanged: (label: string) => void) => UnsubscribeBreadcrumbListener;

export interface PageDefinition {
  name: string;
  topLevel: boolean;
  route: string;
  breadcrumb?: BreadcrumbFn;
  'breadcrumb:t'?: string;
  components: ViewComponent[];
  commands: CommandComponent[];
  tab?: Omit<Tab, "route">;
  service?: string;
}

export interface DynamicSidebar {
  data: string;
  label?: string;
  icon?: string;
  hidden?: string;
}

export interface TopLevelPage extends PageDefinition {
  sidebar: {
    label: string;
    Icon: typeof SvgIcon;
    'label:t'?: string;
    invisible?: string | boolean;
    group?: string | TopLevelGroup;
    position?: number;
    dynamic?: DynamicSidebar;
  };
}

export interface TopLevelGroup {
  label: string;
  icon: string;
  'label:t'?: string;
}

export interface Tab {
  group: string;
  label: string;
  'label:t'?: string;
  route: string;
  icon?: string;
  style?: SxProps;
  styleExpr?: string;
  hidden?: string;
  disabled?: string;
  position?: number;
}

export type TopLevelPageWithProophBoardDescription = TopLevelPage & ProophBoardDescription;

export const isTopLevelPage = (page: PageDefinition): page is TopLevelPage => {
  return page.topLevel;
}

export const belongsToGroup = (page: {sidebar: {group?: string | TopLevelGroup}}): TopLevelGroup | undefined => {
  if(!page.sidebar.group) {
    return;
  }

  if(typeof page.sidebar.group === "string") {
    return {label: page.sidebar.group, icon: 'square'}
  }

  return page.sidebar.group;
}

export interface SubLevelPage extends PageDefinition {
  routeParams: string[]
}

export type SubLevelPageWithProophBoardDescription = SubLevelPage & ProophBoardDescription;

export const isSubLevelPage = (page: PageDefinition): page is SubLevelPage => {
  return !page.topLevel;
}
