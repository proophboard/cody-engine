import {GridDensity} from "@mui/x-data-grid";
import {isObjectSchema} from "@cody-engine/cody/hooks/utils/json-schema/is-object-schema";
import {camelCaseToTitle} from "@frontend/util/string";
import {names} from "@event-engine/messaging/helpers";
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {
  ColumnSingleSelectValueOption,
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
import {get, zip} from "lodash";

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
    }, itemSchema, itemUiSchema, true))

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
    }, propSchema, propUiSchema, itemSchema.required && itemSchema.required.includes(propertyName)))
  }

  return columns;
}

export const enrichColumnConfigFromSchema = (columnConfig: TableColumnUiSchema, schema: JSONSchema7, uiSchema: UiSchema, isRequired: boolean): TableColumnUiSchema => {
  columnConfig = deepClone(columnConfig);

  if(!columnConfig.headerName && !columnConfig.action && !columnConfig.actions) {
    columnConfig.headerName = uiSchema['ui:title'] || uiSchema['ui:options']?.title || schema.title;
  }

  if(!columnConfig.value) {
    if(isJsonSchemaObject(schema)) {
      columnConfig.value = `$> row.${columnConfig.field}|values()|map('item|toStr()')|join(', ')`
    }

    if(isJsonSchemaArray(schema)) {
      columnConfig.value = `$> row.${columnConfig.field}|map('item|toStr()')|join(', ')`
    }

    if(isJsonSchemaString(schema, 'date')) {
      columnConfig.value = isRequired ? `$> row.${columnConfig.field}|date()` : `$> row.${columnConfig.field} ? row.${columnConfig.field}|localDate() : '-'`;
      columnConfig.type = isRequired ? 'date' : 'string';
    }

    if(isJsonSchemaString(schema, 'datetime')) {
      columnConfig.value = isRequired ? `$> row.${columnConfig.field}|date()` : `$> row.${columnConfig.field} ? row.${columnConfig.field}|localDateTime() : '-'`;
      columnConfig.type = isRequired ? 'dateTime' : 'string';
    }

    if(isJsonSchemaString(schema, 'time')) {
      columnConfig.value = isRequired ? `$> row.${columnConfig.field}|localTime()` : `$> row.${columnConfig.field} ? row.${columnConfig.field}|localTime() : undefined`
    }

    if(schema.type === "boolean") {
      columnConfig.value = `$> row.${columnConfig.field} ? true : false`;
      columnConfig.type = "boolean";
    }

    if(schema.enum) {
      columnConfig.type = 'singleSelect';
      columnConfig.valueOptions = getValueOptions(schema.enum as string[], (schema as any).enumNames)
    }
  }

  if(!columnConfig.ref) {
    if(uiSchema['ui:widget'] && uiSchema['ui:widget'] === 'DataSelect') {
      const options = getUiOptions(uiSchema);

      if(options.data) {
        columnConfig.ref = {
          data: String(options.data),
          value: options.label ? String(options.label) : String(options.text)
        }
      }
    }
  }

  return columnConfig;
}

const getValueOptions = (enumValues: string[], enumNames?: string[]): ColumnSingleSelectValueOption[] => {
  if(!enumNames) {
    return enumValues;
  }

  return zip(enumNames, enumValues).map(([label, value]) => ({label: label || '', value: value || ''}))
}
