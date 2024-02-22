import {Rule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {SortOrder, SortOrderItem} from "@event-engine/infrastructure/DocumentStore";
import {GridDensity} from "@mui/x-data-grid";
import {DependencyRegistry, ValueObjectDescriptionFlags} from "@event-engine/descriptions/descriptions";
import {JSONSchema7} from "json-schema-to-ts";
import {UiSchema} from "@rjsf/utils";

export interface ValueObjectMetadataRaw {
  identifier?: string;
  schema: any;
  querySchema?: any;
  resolve?: ResolveConfig;
  queryDependencies?: DependencyRegistry;
  ns?: string;
  collection?: string | boolean;
  initialize?: Rule[];
  uiSchema?: UiSchema & TableUiSchema;
}

export interface ResolveConfig {
  where?: Rule,
  orderBy?: SortOrderItem | SortOrder,
  rules?: Rule[],
}

export interface RefTableColumn {
  data: string;
  value: Rule[] | string;
}

export interface PageLinkTableColumn {
  page: string;
  mapping: Record<string, string>;
}

export interface TableColumnUiSchema {
  field: string;
  headerName?: string;
  flex?: string | number;
  width?: string | number;
  value?: Rule[] | string;
  pageLink?: string | PageLinkTableColumn;
  ref?: { data: string; value: string };
  link?: string | Rule[];
}

export type StringOrTableColumnUiSchema = string | TableColumnUiSchema;

interface TableProps {
  columns?: StringOrTableColumnUiSchema[],
  pageSize?: number,
  pageSizeOptions?: number[],
  density?: GridDensity,
  hideToolbar?: boolean,
  // @TODO: show/hide specific grid toolbar options or hide entire grid toolbar
  // @TODO: support endless scroll, pagination, ... ?
}

export interface TableUiSchema {
  "ui:table"?: TableProps;
  table?: TableProps;
}

export interface ValueObjectMetadata extends ValueObjectDescriptionFlags {
  schema: JSONSchema7;
  querySchema?: JSONSchema7;
  ns: string;
  service: string;
  isList: boolean;
  hasIdentifier: boolean;
  isQueryable: boolean;
  identifier?: string;
  collection?: string;
  initialize?: Rule[];
  itemType?: string;
  resolve?: ResolveConfig;
  queryDependencies?: DependencyRegistry;
  uiSchema?: UiSchema & TableUiSchema;
}
