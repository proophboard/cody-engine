import {CodyResponse, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {Rule} from "../rule-engine/configuration";
import {parseJsonMetadata} from "@proophboard/cody-utils";

export interface DynamicBreadcrumbMetadata {
  data: string;
  expressions: Rule[]
}

export interface UiMetadata {
  route?: string;
  routeParams?: string[];
  sidebar?: {label?: string; icon?: string; show?: boolean | Rule[]};
  breadcrumb?: string;
  dynamicBreadcrumb?: DynamicBreadcrumbMetadata;
}

export const getUiMetadata = (ui: Node, ctx: Context): UiMetadata | CodyResponse => {
  // @todo: validate ui meta
  return parseJsonMetadata(ui);
}
