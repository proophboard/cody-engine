import {GridDensity} from "@mui/x-data-grid";
import {isObjectSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-object-schema";
import {camelCaseToTitle} from "@frontend/util/string";
import {names} from "@event-engine/messaging/helpers";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {
  StringOrTableColumnUiSchema,
  TableColumnUiSchema,
  TableUiSchema
} from "@cody-engine/cody/hooks/utils/value-object/types";
import {JSONSchema7} from "json-schema";
import {isScalarSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-scalar-schema";
import {getUiOptions, UiSchema} from "@rjsf/utils";
import {isJsonSchemaArray} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-array";
import {deepClone} from "@mui/x-data-grid/utils/utils";
import {isJsonSchemaObject} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-object";
import {isJsonSchemaString} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema-string";
import {isJsonSchema} from "@cody-play/infrastructure/vibe-cody/utils/json-schema/is-json-schema";

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

export const getColumns = (information: PlayInformationRuntimeInfo, uiSchema: TableUiSchema, itemSchema: JSONSchema7, itemUiSchema: UiSchema): StringOrTableColumnUiSchema[] => {
  return uiSchema.table?.columns || deriveColumnsFromSchema(information, itemSchema, itemUiSchema);
}

const deriveColumnsFromSchema = (information: PlayInformationRuntimeInfo, itemSchema: JSONSchema7, itemUiSchema: UiSchema): TableColumnUiSchema[] => {
  const columns: TableColumnUiSchema[] = [];

  if(isScalarSchema(itemSchema)) {
    const name = itemSchema.title || itemUiSchema['ui:title'] || itemUiSchema['ui:options']?.title || names(information.desc.name).className;
    columns.push(enrichColumnConfigFromSchema({
      field: name,
      headerName: camelCaseToTitle(name),
      flex: 1,
      value: [{rule: "always", then: {assign: {variable: "value", value: "row"}}}]
    }, itemSchema, itemUiSchema))

    return columns;
  }

  if(!isObjectSchema(itemSchema)) {
    throw new Error(`I'm trying to derive table columns for the list, but the item schema is not of type object.\n To solve the issue either reference another object or change the schema to be an object.`)
  }

  for (const propertyName in itemSchema.properties) {
    const propSchema: JSONSchema7 = itemSchema.properties[propertyName] as JSONSchema7;
    const propUiSchema: UiSchema = itemUiSchema[propertyName] || {};

    columns.push(enrichColumnConfigFromSchema({
      field: propertyName,
      headerName: propSchema.title || propUiSchema['ui:title'] || propUiSchema['ui:options']?.title || camelCaseToTitle(propertyName),
      flex: 1,
    }, propSchema, propUiSchema))
  }

  return columns;
}

export const enrichColumnConfigFromSchema = (columnConfig: TableColumnUiSchema, schema: JSONSchema7, uiSchema: UiSchema): TableColumnUiSchema => {
  columnConfig = deepClone(columnConfig);

  if(!columnConfig.headerName) {
    columnConfig.headerName = uiSchema['ui:title'] || uiSchema['ui:options']?.title || schema.title;
  }

  if(!columnConfig.value) {
    if(isJsonSchemaObject(schema)) {
      columnConfig.value = `row.${columnConfig.field}|values()|map('item|toStr()')|join(', ')`
    }

    if(isJsonSchemaArray(schema)) {
      columnConfig.value = `row.${columnConfig.field}|map('item|toStr()')|join(', ')`
    }

    if(isJsonSchemaString(schema, 'date')) {
      columnConfig.value = `row.${columnConfig.field}|localDate()`
    }

    if(isJsonSchemaString(schema, 'datetime')) {
      columnConfig.value = `row.${columnConfig.field}|localDateTime()`
    }

    if(isJsonSchemaString(schema, 'time')) {
      columnConfig.value = `row.${columnConfig.field}|localTime()`
    }
  }

  if(!columnConfig.ref) {
    if(uiSchema['ui:widget'] && uiSchema['ui:widget'] === 'DataSelect') {
      const options = getUiOptions(uiSchema);

      if(options.data) {
        columnConfig.ref = {
          data: String(options.data),
          value: String(options.text)
        }
      }
    }
  }

  return columnConfig;
}
