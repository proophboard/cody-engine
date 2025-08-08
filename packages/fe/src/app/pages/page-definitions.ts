import {QueryClient} from "@tanstack/react-query";
import {SvgIcon, SxProps} from "@mui/material";
import {ProophBoardDescription} from "@event-engine/descriptions/descriptions";
import {CommandComponent, ViewComponent} from "@cody-engine/cody/hooks/utils/ui/types";
import {camelCaseToTitle} from "@frontend/util/string";
import {PageRegistry} from "@frontend/app/pages/index";
import {names} from "@event-engine/messaging/helpers";
import {PropMapping} from "@app/shared/rule-engine/configuration";

export type UnsubscribeBreadcrumbListener = () => void;
export type BreadcrumbFn = (params: Record<string, string>, queryClient: QueryClient, onLabelChanged: (label: string) => void) => UnsubscribeBreadcrumbListener;
export type PageType = 'standard' | 'dialog' | 'drawer';

export interface PageDefinition {
  name: string;
  title?: string;
  'title:expr'?: string;
  type?: PageType;
  mainPage?: string;
  topLevel: boolean;
  route: string;
  breadcrumb?: BreadcrumbFn;
  'breadcrumb:t'?: string;
  components: ViewComponent[];
  commands: CommandComponent[];
  tab?: Omit<Tab, "route" | 'routeTemplate'>;
  service?: string;
  props?: Record<string, any>,
  'props:expr'?: PropMapping,
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
  routeTemplate: string;
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

export const getPageTitle = (page: PageDefinition): string => {
  if(!page.name) {
    return '';
  }

  return page.title || camelCaseToTitle(page.name.split(".").pop() as string);
}

export const getPageType = (page: PageDefinition): PageType => {
  return page.type || 'standard';
}

export const getPageFQCN = (pageName: string, defaultService: string) => {
  const parts = pageName.split(".");

  if(parts.length === 1) {
    parts.unshift(defaultService);
  }

  return parts.map(p => names(p).className).join(".");
}

export const getMainPage = (page: PageDefinition, pages: PageRegistry, defaultService: string): PageDefinition => {
  if(!page.mainPage) {
    throw new Error(`No main page defined for dialog: "${page.name}". Please configure a "mainPage" in the page configuration on prooph board`);
  }

  const mainPageName = getPageFQCN(page.mainPage, page.service || defaultService);

  if(!pages[mainPageName]) {
    throw new Error(`Main page "${mainPageName}" of dialog "${page.name}" cannot be found in the registry. Did you forget to pass the page configuration from prooph board to Cody?`);
  }

  return pages[mainPageName];
}
