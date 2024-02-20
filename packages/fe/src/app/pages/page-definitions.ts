import {QueryClient} from "@tanstack/react-query";
import {SvgIcon, SxProps} from "@mui/material";
import {ProophBoardDescription} from "@event-engine/descriptions/descriptions";

export type UnsubscribeBreadcrumbListener = () => void;
export type BreadcrumbFn = (params: Record<string, string>, queryClient: QueryClient, onLabelChanged: (label: string) => void) => UnsubscribeBreadcrumbListener;

export interface PageDefinition {
  topLevel: boolean;
  route: string;
  breadcrumb: BreadcrumbFn;
  components: string[];
  commands: string[];
  tab?: Omit<Tab, "route">;
}

export interface TopLevelPage extends PageDefinition {
  sidebar: {label: string, Icon: typeof SvgIcon, invisible?: string | boolean, group?: string | TopLevelGroup, position?: number}
}

export interface TopLevelGroup {
  label: string,
  icon: string,
}

export interface Tab {
  group: string;
  label: string;
  route: string;
  icon?: string;
  style?: SxProps;
  styleExpr?: string;
  hidden?: string;
  disabled?: string;
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
