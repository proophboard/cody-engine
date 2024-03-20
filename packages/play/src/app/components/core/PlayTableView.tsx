import { Box, CircularProgress, Typography } from '@mui/material';
import {DataGrid, GridColDef, GridRenderCellParams, GridToolbar} from '@mui/x-data-grid';
import {useContext, useEffect} from 'react';
import { triggerSideBarAnchorsRendered } from '@frontend/util/sidebar/trigger-sidebar-anchors-rendered';
import NoRowsOverlay from '@frontend/app/components/core/table/NoRowsOverlay';
import jexl from '@app/shared/jexl/get-configured-jexl';
import { dataValueGetter } from '@frontend/util/table/data-value-getter';
import { determineQueryPayload } from '@app/shared/utils/determine-query-payload';
import PageLink from '@frontend/app/components/core/PageLink';
import { mapProperties } from '@app/shared/utils/map-properties';
import { stringify } from '@app/shared/utils/stringify';
import {useApiQuery} from "@frontend/queries/use-api-query";
import {
  PlayInformationRegistry,
  PlayInformationRuntimeInfo, PlayPageRegistry,
  PlayQueryRegistry,
  PlaySchemaDefinitions
} from "@cody-play/state/types";
import {
  isQueryableListDescription,
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {UiSchema} from "@rjsf/utils";
import {
  getColumns,
  getPageDefinition,
  getTableDensity,
  getTablePageSizeConfig
} from "@cody-play/infrastructure/ui-table/utils";
import {names} from "@event-engine/messaging/helpers";
import {informationTitle} from "@cody-play/infrastructure/information/titelize";
import {UseQueryResult} from "@tanstack/react-query";
import {isListSchema} from "@cody-engine/cody/hooks/utils/json-schema/list-schema";
import {camelCaseToTitle} from "@frontend/util/string";
import {AnyRule} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {configStore} from "@cody-play/state/config-store";
import {
  PageLinkTableColumn, RefTableColumn,
  TableColumnUiSchema,
  TableUiSchema
} from "@cody-engine/cody/hooks/utils/value-object/types";
import {PageDefinition} from "@frontend/app/pages/page-definitions";
import {JSONSchema7} from "json-schema";
import {usePageData} from "@frontend/hooks/use-page-data";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {resolveRefs} from "@event-engine/messaging/resolve-refs";
import {useUser} from "@frontend/hooks/use-user";
import {User} from "@app/shared/types/core/user/user";

const PlayTableView = (params: any, informationInfo: PlayInformationRuntimeInfo) => {
  if(!isQueryableStateListDescription(informationInfo.desc) && !isQueryableListDescription(informationInfo.desc)) {
    throw new Error(`Play table view can only be used to show queriable state list information, but "${informationInfo.desc.name}" is not of this information type. ${CONTACT_PB_TEAM}`)
  }

  const {config: {queries, types, pages, definitions}} = useContext(configStore);
  const [,addQueryResult] = usePageData();
  const [user] = useUser();

  const query = useApiQuery(informationInfo.desc.query, params);

  const uiSchema: UiSchema & TableUiSchema = informationInfo.uiSchema || {};

  // Normalize table uiSchema
  if(uiSchema['ui:table']) {
    uiSchema.table = uiSchema['ui:table'];
  }

  const pageSizeConfig = getTablePageSizeConfig(uiSchema);
  const density = getTableDensity(uiSchema);
  const hideToolbar = !!uiSchema.table?.hideToolbar;

  const itemIdentifier = isQueryableStateListDescription(informationInfo.desc)? informationInfo.desc.itemIdentifier : undefined;

  useEffect(() => {
    triggerSideBarAnchorsRendered();
  }, [params]);

  useEffect(() => {
    addQueryResult(registryIdToDataReference(informationInfo.desc.name), query);
  }, [params, query.dataUpdatedAt]);

  const columns: GridColDef[] = compileTableColumns(
    params,
    informationInfo,
    uiSchema,
    queries,
    pages,
    user,
    types,
    definitions
  );

  return (
    <Box component="div">
      <Typography
        variant="h3"
        className="sidebar-anchor"
        sx={{ padding: (theme) => theme.spacing(4), paddingLeft: 0 }}
        id={"component-" + names(informationInfo.desc.name).fileName}
      >
        {informationTitle(informationInfo)}
      </Typography>
      {query.isLoading && <CircularProgress />}
      {query.isSuccess && (
        <DataGrid
          columns={columns}
          rows={query.data}
          getRowId={(row) => itemIdentifier ? row[itemIdentifier] : JSON.stringify(row)}
          sx={{ width: '100%' }}
          slots={{
            toolbar: hideToolbar? undefined : GridToolbar,
            noRowsOverlay: NoRowsOverlay,
          }}
          initialState={{ pagination: { paginationModel: { pageSize: pageSizeConfig.pageSize } } }}
          pageSizeOptions={pageSizeConfig.pageSizeOptions}
          density={density}
        />
      )}
    </Box>
  );
};

export default PlayTableView;

type RefQueryMap = {[column: string]: UseQueryResult}

const compileTableColumns = (
  params: any,
  information: PlayInformationRuntimeInfo,
  uiSchema: TableUiSchema,
  queries: PlayQueryRegistry,
  pages: PlayPageRegistry,
  user: User,
  types: PlayInformationRegistry,
  schemaDefinitions: PlaySchemaDefinitions
): GridColDef[] => {
  const schema = information.schema;

  if (!isListSchema(schema)) {
    throw new Error(`Cannot render table. Schema of "${information.desc.name}" is not a list.`);
  }

  const columns = getColumns(information, uiSchema, resolveRefs(schema.items, schemaDefinitions));

  const columnQueries: RefQueryMap = {};

  const gridColDefs: GridColDef[] = [];

  const getColValueWithExpr = (rowParams: GridRenderCellParams, cValue: string | AnyRule[]): any => {
    let ctx = {...rowParams, value: '', user};

    if (typeof cValue === 'string') {
      return jexl.evalSync(cValue, ctx);
    }

    const exe = makeSyncExecutable(cValue as AnyRule[]);

    ctx = exe(ctx);

    return ctx.value;
  }

  for (let column of columns) {
    // @TODO: Validate column

    if (typeof column === "string") {
      column = {
        field: column
      }
    }

    if (!column.field) {
      throw new Error(`Missing "field" property in a column definition. Every column needs to have at least a field property. Please check your configuration`);
    }

    if (!column['headerName']) {
      column['headerName'] = camelCaseToTitle(column['field']);
    }

    if (!column['flex'] && !column['width']) {
      column['flex'] = 1;
    }

    let hasValueGetter = false;

    let cKey: keyof (TableColumnUiSchema);

    const gridColDef: Partial<GridColDef> = {};

    for (cKey in column) {
      const cValue = column[cKey];

      switch (cKey) {
        case "pageLink":
          const pageLinkConfig: PageLinkTableColumn = typeof cValue === "string" ? {
            page: cValue,
            mapping: {}
          } : cValue as PageLinkTableColumn;

          gridColDef.renderCell = (rowParams) => <PageLink page={getPageDefinition(pageLinkConfig, information, pages) as unknown as PageDefinition}
                                                           params={mapProperties({...rowParams.row, ...params}, pageLinkConfig.mapping)}
          >{rowParams.value}</PageLink>;
          break;
        case "value":
          gridColDef.valueGetter = (rowParams) => {
            return getColValueWithExpr(rowParams, cValue as any);
          }

          hasValueGetter = true;
          break;
        case "ref":
          const refListVo = getVOFromTypes((cValue as RefTableColumn).data, information.schema as JSONSchema7 & {$id: string}, types);

          if (!refListVo) {
            throw new Error(`Cannot find Information "${(cValue as RefTableColumn).data}" configured in column ref of column: "${column.field}".`);
          }

          const refListDesc = refListVo.desc;

          if (!isQueryableStateListDescription(refListDesc) && !isQueryableNotStoredStateListDescription(refListDesc)) {
            throw new Error(`The ref in column "${column.field}" is not a list! Only lists can be used to load reference data.`);
          }

          const columnQuery = queries[refListDesc.query];

          if (!columnQuery) {
            throw new Error(`Cannot resolve column ref of column "${column.field}". The query is unknown: "${refListDesc.query}". Did you forget to pass the corresponding information card to Cody?`);
          }

          if (!columnQueries[column.field]) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            columnQueries[column.field] = useApiQuery(
              columnQuery.desc.name,
              determineQueryPayload(params, columnQuery as unknown as QueryRuntimeInfo)
            )
          }

          const field = column.field;
          const value = (cValue as RefTableColumn).value;

          gridColDef.valueGetter = (rowParams) => {
            let rowParamsVal = rowParams.value;

            if(typeof column !== "string" && column['value']) {
              rowParamsVal = getColValueWithExpr(rowParams, column['value']);
            }

            return dataValueGetter(
              columnQueries[field],
              refListDesc.itemIdentifier,
              rowParamsVal,
              (data: any) => {
                let ctx = {data, value: '', user};

                if (typeof value === 'string') {
                  return jexl.evalSync(value, ctx);
                }

                const exe = makeSyncExecutable(value as AnyRule[]);

                ctx = exe(ctx);

                return ctx.value;
              }
            )
          }

          hasValueGetter = true;
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gridColDef[cKey] = cValue;
      }
    }

    if (!hasValueGetter) {
      gridColDef.valueGetter = params => stringify(params.value);
    }

    gridColDefs.push(gridColDef as GridColDef);
  }

  return gridColDefs;
}

const getVOFromTypes = (refOrFQCN: string, rootSchema: JSONSchema7 & {$id: string}, types: PlayInformationRegistry): PlayInformationRuntimeInfo | null => {
  if(refOrFQCN[0] === "/") {
    const rootId = rootSchema.$id || '';
    const definitionIdParts = rootId.replace('/definitions/', '').split('/');
    const service = names(definitionIdParts[0] || '').className;
    refOrFQCN = (service + refOrFQCN).split("/").join(".");
  }

  if(!types[refOrFQCN]) {
    return null;
  }

  return types[refOrFQCN];
}
