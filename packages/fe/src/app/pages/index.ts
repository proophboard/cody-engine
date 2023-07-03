import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {Dashboard} from "@frontend/app/pages/core/dashboard";

export type PageRegistry = {[pageName: string]: PageDefinition};

export const pages: PageRegistry = {
  Dashboard: Dashboard,
}
