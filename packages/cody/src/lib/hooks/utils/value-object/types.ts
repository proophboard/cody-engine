import {Rule} from "@app/shared/rule-engine/configuration";
import {SortOrder, SortOrderItem} from "@event-engine/infrastructure/DocumentStore";
import {GridDensity} from "@mui/x-data-grid";
import {DependencyRegistry, ValueObjectDescriptionFlags} from "@event-engine/descriptions/descriptions";
import {JSONSchema7} from "json-schema-to-ts";
import {UiSchema} from "@rjsf/utils";
import {ProjectionConfig} from "@app/shared/rule-engine/projection-config";
import {Action, ButtonAction} from "@frontend/app/components/core/form/types/action";

export interface ValueObjectMetadataRaw {
  identifier?: string;
  schema: any;
  querySchema?: any;
  resolve?: ResolveConfig;
  resolveRulesOnly?: boolean;
  queryDependencies?: DependencyRegistry;
  ns?: string;
  collection?: string | boolean;
  initialize?: Rule[];
  uiSchema?: UiSchema & TableUiSchema;
  projection?: ProjectionConfig;
  shorthand?: boolean;
  staticView?: boolean;
}

export interface ResolveConfig {
  where?: Rule,
  orderBy?: SortOrderItem | SortOrder,
  rules?: Rule[],
}

export interface RefTableColumn {
  data: string;
  value: Rule[] | string;
  itemIdentifier?: string;
  multiple?: boolean;
}

export interface PageLinkTableColumn {
  page: string;
  mapping: Record<string, string>;
  'page:expr'?: string;
}

export type ActionTableColumn = ButtonAction & {showInMenu?: boolean};

export type ColumnSingleSelectValueOption = string | {label: string, value: string};

export interface TableColumnUiSchema {
  field: string;
  headerName?: string;
  type?: 'string' | 'number' | 'date' | 'dateTime' | 'boolean' | 'singleSelect' | 'actions';
  flex?: string | number;
  width?: string | number;
  value?: Rule[] | string;
  valueOptions?: ColumnSingleSelectValueOption[];
  pageLink?: string | PageLinkTableColumn;
  action?: ActionTableColumn;
  actions?: ActionTableColumn[];
  ref?: { data: string; value: string; itemIdentifier?: string; multiple?: boolean };
  link?: string | Rule[];
}

export type StringOrTableColumnUiSchema = string | TableColumnUiSchema;

interface TableProps {
  columns?: StringOrTableColumnUiSchema[],
  pageSize?: number,
  pageSizeOptions?: number[],
  density?: GridDensity,
  hideToolbar?: boolean,
  checkboxSelection?: boolean,
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
  resolveRulesOnly?: boolean;
  queryDependencies?: DependencyRegistry;
  uiSchema?: UiSchema & TableUiSchema;
  projection?: ProjectionConfig;
  staticView?: boolean;
}
