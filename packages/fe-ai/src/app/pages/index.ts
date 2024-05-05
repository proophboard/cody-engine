import {PageDefinition} from "@frontend-ai/app/pages/page-definitions";
import {Dashboard} from "@frontend-ai/app/pages/core/dashboard";

export type PageRegistry = {[pageName: string]: PageDefinition};

export const pages: PageRegistry = {
  Dashboard: Dashboard,
}
