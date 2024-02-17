import {GridDensity} from "@mui/x-data-grid";
import {isObjectSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-object-schema";
import {camelCaseToTitle} from "@frontend/util/string";
import {names} from "@event-engine/messaging/helpers";
import {PlayInformationRuntimeInfo, PlayPageDefinition, PlayPageRegistry} from "@cody-play/state/types";
import {
  PageLinkTableColumn,
  StringOrTableColumnUiSchema,
  TableColumnUiSchema,
  TableUiSchema
} from "@cody-engine/cody/hooks/utils/value-object/types";
import {JSONSchema7} from "json-schema";
import {isScalarSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-scalar-schema";

export const getTablePageSizeConfig = (uiSchema: TableUiSchema): {pageSize: number, pageSizeOptions: number[]} => {
  let pageSize: number, pageSizeOptions: number[];

  if(!uiSchema.table || !uiSchema.table.pageSize) {
    pageSize = 5;
  } else {
    pageSize = uiSchema.table.pageSize;
  }

  if(!uiSchema.table || !uiSchema.table.pageSizeOptions) {
    pageSizeOptions = [5, 10, 25];
  } else {
    pageSizeOptions = uiSchema.table.pageSizeOptions;
  }

  return {
    pageSize,
    pageSizeOptions
  }
}

export const getTableDensity = (uiSchema: TableUiSchema): GridDensity => {
  return uiSchema.table?.density || 'comfortable';
}

export const getColumns = (information: PlayInformationRuntimeInfo, uiSchema: TableUiSchema, itemSchema: JSONSchema7): StringOrTableColumnUiSchema[] => {
  return uiSchema.table?.columns || deriveColumnsFromSchema(information, itemSchema);
}

const deriveColumnsFromSchema = (information: PlayInformationRuntimeInfo, itemSchema: JSONSchema7): TableColumnUiSchema[] => {
  const columns: TableColumnUiSchema[] = [];

  if(isScalarSchema(itemSchema)) {
    const name = itemSchema.title || names(information.desc.name).className;
    columns.push({
      field: name,
      headerName: camelCaseToTitle(name),
      flex: 1,
      value: [{rule: "always", then: {assign: {variable: "value", value: "row"}}}]
    })

    return columns;
  }

  if(!isObjectSchema(itemSchema)) {
    throw new Error(`I'm trying to derive table columns for the list, but the item schema is not of type object.\n To solve the issue either reference another object or change the schema to be an object.`)
  }

  for (const propertyName in itemSchema.properties) {
    const propSchema: JSONSchema7 = itemSchema.properties[propertyName] as JSONSchema7;

    columns.push({
      field: propertyName,
      headerName: propSchema.title || camelCaseToTitle(propertyName),
      flex: 1,
    })
  }

  return columns;
}

export const getPageDefinition = (linkedPage: PageLinkTableColumn, information: PlayInformationRuntimeInfo, pages: PlayPageRegistry): PlayPageDefinition => {
  const parts = linkedPage.page.split(".");
  let service: string, pageName: string;

  if(parts.length === 2) {
    [service, pageName] = parts;
  } else {
    service = information.desc.name.split('.').shift() || '';
    pageName = linkedPage.page;
  }

  const pageFullName = names(service).className + '.' + names(pageName).className;

  const page = pages[pageFullName];

  if(!page) {
    throw new Error(`Cannot find page "${pageFullName}". Did you forget to pass it to Cody?`);
  }

  return page;
}
