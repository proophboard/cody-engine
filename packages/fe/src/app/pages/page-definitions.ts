import {QueryClient} from "@tanstack/react-query";
import {SvgIcon} from "@mui/material";
import {ProophBoardDescription} from "@event-engine/descriptions/descriptions";

export type UnsubscribeBreadcrumbListener = () => void;
export type BreadcrumbFn = (params: Record<string, string>, queryClient: QueryClient, onLabelChanged: (label: string) => void) => UnsubscribeBreadcrumbListener;

export interface PageDefinition {
  topLevel: boolean;
  route: string;
  breadcrumb: BreadcrumbFn;
  components: string[];
  commands: string[];
}

export interface TopLevelPage extends PageDefinition {
  sidebar: {label: string, Icon: typeof SvgIcon, invisible?: string | boolean}
}

export type TopLevelPageWithProophBoardDescription = TopLevelPage & ProophBoardDescription;

export const isTopLevelPage = (page: PageDefinition): page is TopLevelPage => {
  return page.topLevel;
}

export interface SubLevelPage extends PageDefinition {
  routeParams: string[]
}

export type SubLevelPageWithProophBoardDescription = SubLevelPage & ProophBoardDescription;

export const isSubLevelPage = (page: PageDefinition): page is SubLevelPage => {
  return !page.topLevel;
}
