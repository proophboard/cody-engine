import {CodyResponse, CodyResponseType, Node} from "@proophboard/cody-types";
import {Context} from "../../context";
import {FsTree} from "nx/src/generators/tree";
import {detectService} from "../detect-service";
import {isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {
  getVoMetadata,
  PageLinkTableColumn,
  RefTableColumn,
  TableColumnUiSchema,
  ValueObjectMetadata
} from "../value-object/get-vo-metadata";
import {isQueryableStateListDescription} from "@event-engine/descriptions/descriptions";
import {FQCNFromDefinitionId} from "../value-object/definitions";
import {getVoFromSyncedNodes} from "../value-object/get-vo-from-synced-nodes";
import {isObjectSchema} from "../json-schema/is-object-schema";
import {JSONSchema7} from "json-schema-to-ts";
import {camelCaseToTitle} from "@frontend/util/string";
import {addImport} from "../imports";
import {generateFiles} from "@nx/devkit";
import {registerViewComponent} from "../registry";
import {isListSchema} from "../json-schema/list-schema";
import {Rule} from "../rule-engine/configuration";
import {convertRuleConfigToTableColumnValueGetterRules} from "../rule-engine/convert-rule-config-to-behavior";

export const upsertListViewComponent = async (vo: Node, voMeta: ValueObjectMetadata, ctx: Context, tree: FsTree): Promise<boolean|CodyResponse> => {
  const service = detectService(vo, ctx);

  if(isCodyError(service)) {
    return service;
  }

  const serviceNames = names(service);
  const voNames = names(vo.getName());

  if(!isQueryableStateListDescription(voMeta)) {
    return {
      cody: `Upps, upsertListViewComponent is called with a non-QueryableStateList Value Object.`,
      type: CodyResponseType.Error,
      details: `This should never happen and is a bug in the source code. Please contact the prooph board team for bugfixing.`
    }
  }

  const itemVO = getItemVO(vo, voMeta, ctx);

  if(isCodyError(itemVO)) {
    return itemVO;
  }

  const itemVOMeta = getVoMetadata(itemVO, ctx);

  if(isCodyError(itemVOMeta)) {
    return itemVOMeta;
  }

  const identifier = itemVOMeta.identifier;

  const columnsResponse = compileTableColumns(vo, voMeta, itemVO, itemVOMeta, ctx);

  if(isCodyError(columnsResponse)) {
    return columnsResponse;
  }

  const [columns, imports, hooks] = columnsResponse;

  // @todo: handle render cell with Rule[]
  // @see: car-list.tsx

  generateFiles(tree, __dirname + '/../../ui-files/list-view-files', ctx.feSrc, {
    tmpl: '',
    service: serviceNames.fileName,
    serviceNames,
    identifier,
    columns: `${columns.join(",\n")}`,
    imports: imports.join(";\n"),
    hooks: hooks.join(";\n"),
    ...voNames
  })

  registerViewComponent(service, vo, ctx, tree);

  return true;
}

const compileTableColumns = (vo: Node, voMeta: ValueObjectMetadata, itemVO: Node, itemVOMeta: ValueObjectMetadata, ctx: Context): [string[], string[], string[]] | CodyResponse => {
  const columns = getColumns(vo, voMeta, itemVO, itemVOMeta, ctx);
  let imports: string[] = [];
  let hooks: string[] = [];

  if(isCodyError(columns)) {
    return columns;
  }

  const strColumns: string[] = [];

  for (const column of columns) {
    // @TODO: Validate column

    if(!column['headerName']) {
      column['headerName'] = camelCaseToTitle(column['field']);
    }

    if(!column['flex'] && !column['width']) {
      column['flex'] = 1;
    }

    let objStr = "{\n";
    const indent = "    ";
    let hasValueGetter = false;

    let cKey: keyof(TableColumnUiSchema);

    for (cKey in column) {
      const cValue = column[cKey];

      switch (cKey) {
        case "pageLink":
          const pageLinkConfig: PageLinkTableColumn = typeof cValue === "string" ? {page: cValue, mapping: {}} : cValue as PageLinkTableColumn;

          const preparedLink = preparePageLink(pageLinkConfig, vo, ctx);
          if(isCodyError(preparedLink)) {
            return preparedLink;
          }

          const [pageName, pageImport] = preparedLink;

          imports = addImport('import PageLink from "@frontend/app/components/core/PageLink"', imports);
          imports = addImport('import {mapProperties} from "@app/shared/utils/map-properties"', imports);
          imports = addImport(pageImport, imports);
          objStr += `${indent}renderCell: params => <PageLink page={${pageName}} params={mapProperties(params.row, ${JSON.stringify(pageLinkConfig.mapping)})}>{params.value}</PageLink>,\n`
          break;
        case "value":
          imports = addImport('import * as jexl from "jexl"', imports);
          const valueGetter = prepareValueGetter(vo, cValue as Rule[], ctx, indent);
          if(isCodyError(valueGetter)) {
            return valueGetter;
          }

          objStr += `${indent}valueGetter: ${valueGetter},\n`;
          hasValueGetter = true;
          break;
        case "ref":
          imports = addImport('import * as jexl from "jexl"', imports);
          imports = addImport('import {dataValueGetter} from "@frontend/util/table/data-value-getter"', imports);
          imports = addImport('import {determineQueryPayload} from "@app/shared/utils/determine-query-payload";', imports);

          const listVO = getVoFromSyncedNodes((cValue as RefTableColumn).data, ctx);

          if(isCodyError(listVO)) {
            return listVO;
          }

          const dataValueGetterResult = prepareDataValueGetter(column.field, vo, listVO, (cValue as RefTableColumn).value, ctx, imports, indent);

          if(isCodyError(dataValueGetterResult)) {
            return dataValueGetterResult;
          }

          const [updatedImports, hook, dataValueGetter] = dataValueGetterResult;

          imports = updatedImports;
          hooks.push(hook);
          objStr += `${indent}valueGetter: ${dataValueGetter},\n`;
          hasValueGetter = true;
          break;
        default:
          objStr += `${indent}${cKey}: ${JSON.stringify(cValue)},\n`
      }

    }

    if(!hasValueGetter) {
      objStr += `${indent}valueGetter: params => stringify(params.value),\n`;
      imports = addImport('import {stringify} from "@app/shared/utils/stringify"', imports);
    }

    objStr += `${indent}}`;

    strColumns.push(objStr);
  }


  return [strColumns, imports, hooks];
}

const getColumns = (vo: Node, voMeta: ValueObjectMetadata, itemVO: Node, itemVOMeta: ValueObjectMetadata, ctx: Context): TableColumnUiSchema[] | CodyResponse => {
  return voMeta.uiSchema?.table?.columns || deriveColumnsFromSchema(vo, voMeta, itemVO, itemVOMeta, ctx);
}

const getItemVO = (vo: Node, voMeta: ValueObjectMetadata, ctx: Context): Node | CodyResponse => {
  const {schema} = voMeta;

  if(!isListSchema(schema)) {
    return {
      cody: `I'm trying to derive table columns from the list value object schema of "${vo.getName()}", but the items schema does not reference an item value object.`,
      type: CodyResponseType.Error,
      details: `To solve the issue use a reference to another object like:\nJSON Schema: { items: { "$ref": "/Namespace/Name" } }\nor shorhand schema: {"$items": "/Namespace/Name" }`
    }
  }

  const itemFQCN = FQCNFromDefinitionId(schema.items.$ref);
  return getVoFromSyncedNodes(itemFQCN, ctx);
}

const deriveColumnsFromSchema = (vo: Node, voMeta: ValueObjectMetadata, itemVO: Node, itemVOMeta: ValueObjectMetadata, ctx: Context): TableColumnUiSchema[] | CodyResponse => {
  const columns: TableColumnUiSchema[] = [];

  const itemSchema = itemVOMeta.schema;

  if(!isObjectSchema(itemSchema)) {
    return {
      cody: `I'm trying to derive table columns for the list value object "${vo.getName()}", but the item schema of value object "${itemVO.getName()}" is not of type object.`,
      type: CodyResponseType.Error,
      details: `To solve the issue either reference another object in "${vo.getName()}" or change the schema of "${itemVO.getName()}" to be an object.`
    }
  }

  for (const propertyName in itemSchema.properties) {
    const propSchema: JSONSchema7 & {title?: string} = itemSchema.properties[propertyName];

    columns.push({
      field: propertyName,
      headerName: propSchema.title || camelCaseToTitle(propertyName),
      flex: 1,
    })
  }

  return columns;
}

const preparePageLink = (linkedPage: PageLinkTableColumn, vo: Node, ctx: Context): [string, string] | CodyResponse => {
  const parts = linkedPage.page.split(".");
  let service: string, pageName: string;

  if(parts.length === 2) {
    [service, pageName] = parts;
  } else {
    const serviceOrError = detectService(vo, ctx);

    if(isCodyError(serviceOrError)) {
      return serviceOrError;
    }

    service = serviceOrError;
    pageName = linkedPage.page;
  }

  return [names(pageName).className, `import {${names(pageName).className}} from "@frontend/app/pages/${names(service).fileName}/${names(pageName).fileName}"`]
}

const prepareValueGetter = (vo: Node, valueGetter: Rule[], ctx: Context, indent: string): string | CodyResponse => {
  const expr = convertRuleConfigToTableColumnValueGetterRules(vo, ctx, valueGetter, indent + '  ');

  return `(params) => {
${indent}  const ctx: any = params;
${indent}      
${indent}  ${expr};
${indent}
${indent}  return ctx.value;
${indent}}`;
}

const prepareDataValueGetter = (columnName: string, vo: Node, listVo: Node, valueGetter: Rule[] | string, ctx: Context, imports: string[], indent: string): [string[], string, string] | CodyResponse => {
  const listVoMeta = getVoMetadata(listVo, ctx);

  if(isCodyError(listVoMeta)) {
    return listVoMeta;
  }

  const listVoService = detectService(listVo, ctx);

  if(isCodyError(listVoService)) {
    return listVoService;
  }

  if(!isQueryableStateListDescription(listVoMeta)) {
    return {
      cody: `Data of a column reference needs to be a queryable state list, but column "${columnName}" references data type "${listVo.getName()}", which is not a list or not queryable.`,
      type: CodyResponseType.Error
    }
  }

  const serviceNames = names(listVoService);
  const listVoNames = names(listVo.getName());
  const columnNames = names(columnName);

  imports = addImport(`import {useGet${listVoNames.className}} from "@frontend/queries/${serviceNames.fileName}/use-get-${listVoNames.fileName}"`, imports);
  imports = addImport(`import {${serviceNames.className}Get${listVoNames.className}QueryRuntimeInfo} from "@app/shared/queries/${serviceNames.fileName}/get-${listVoNames.fileName}"`, imports);

  const hook = `  const ${columnNames.propertyName}ColumnQuery = useGet${listVoNames.className}(determineQueryPayload(params, ${serviceNames.className}Get${listVoNames.className}QueryRuntimeInfo));`

  const expr = convertRuleConfigToTableColumnValueGetterRules(vo, ctx, valueGetter, indent + '  ');

  const valueGetterFn = `(params) => {
${indent}  return dataValueGetter(
${indent}    ${columnNames.propertyName}ColumnQuery,
${indent}    "${listVoMeta.identifier}",
${indent}    params.value,
${indent}    (data) => {
${indent}      const ctx: any = {data};
${indent}      ${expr};
${indent}      return ctx.value;
${indent}    }
${indent}  )
${indent}}`;

  return [imports, hook, valueGetterFn];
}
