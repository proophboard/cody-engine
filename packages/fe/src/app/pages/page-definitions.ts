import React from "react";
import {QueryClient} from "@tanstack/react-query";

export type UnsubscribeBreadcrumbListener = () => void;
export type BreadcrumbFn = (params: Record<string, string>, queryClient: QueryClient, onLabelChanged: (label: string) => void) => UnsubscribeBreadcrumbListener;

export interface PageDefinition {
  topLevel: boolean;
  route: string;
  breadcrumb: BreadcrumbFn;
  components: React.FunctionComponent<any>[];
  commands: React.FunctionComponent[];
}

export interface TopLevelPage extends PageDefinition {
  sidebar: {label: string}
}

export const isTopLevelPage = (page: PageDefinition): page is TopLevelPage => {
  return page.topLevel;
}

export interface SubLevelPage extends PageDefinition {
  routeParams: string[]
}

export const isSubLevelPage = (page: PageDefinition): page is SubLevelPage => {
  return !page.topLevel;
}
