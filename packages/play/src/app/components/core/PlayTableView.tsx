import {Box, CircularProgress, IconButton, Typography, useTheme} from '@mui/material';
import {
  DataGrid, GridActionsColDef,
  GridColDef, GridDensity,
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid';
import React, {useContext, useEffect, useState} from 'react';
import { triggerSideBarAnchorsRendered } from '@frontend/util/sidebar/trigger-sidebar-anchors-rendered';
import NoRowsOverlay from '@frontend/app/components/core/table/NoRowsOverlay';
import { dataValueGetter } from '@frontend/util/table/data-value-getter';
import { determineQueryPayload } from '@app/shared/utils/determine-query-payload';
import PageLink, {
  getPageDefinition,
} from '@frontend/app/components/core/PageLink';
import { mapProperties } from '@app/shared/utils/map-properties';
import { stringify } from '@app/shared/utils/stringify';
import { useApiQuery } from '@frontend/queries/use-api-query';
import {
  PlayInformationRegistry,
  PlayInformationRuntimeInfo,
  PlayPageRegistry,
  PlayQueryRegistry,
  PlaySchemaDefinitions,
} from '@cody-play/state/types';
import {
  isListDescription,
  isQueryableListDescription,
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription,
  isStoredQueryableListDescription,
} from '@event-engine/descriptions/descriptions';
import { CONTACT_PB_TEAM } from '@cody-play/infrastructure/error/message';
import { getUiOptions, UiSchema } from '@rjsf/utils';
import {
  enrichColumnConfigFromSchema,
  getColumns,
  getTableDensity,
  getTablePageSizeConfig,
} from '@cody-play/infrastructure/ui-table/utils';
import { names } from '@event-engine/messaging/helpers';
import { UseQueryResult } from '@tanstack/react-query';
import { isListSchema } from '@cody-engine/cody/hooks/utils/json-schema/list-schema';
import { camelCaseToTitle } from '@frontend/util/string';
import { AnyRule } from '@app/shared/rule-engine/configuration';
import { makeSyncExecutable } from '@cody-play/infrastructure/rule-engine/make-executable';
import { QueryRuntimeInfo } from '@event-engine/messaging/query';
import { configStore } from '@cody-play/state/config-store';
import {
  ActionTableColumn,
  PageLinkTableColumn,
  RefTableColumn,
  TableColumnUiSchema,
  TableUiSchema,
} from '@cody-engine/cody/hooks/utils/value-object/types';
import { JSONSchema7 } from 'json-schema';
import { usePageData } from '@frontend/hooks/use-page-data';
import { registryIdToDataReference } from '@app/shared/utils/registry-id-to-data-reference';
import { resolveRefs } from '@event-engine/messaging/resolve-refs';
import { useUser } from '@frontend/hooks/use-user';
import { User } from '@app/shared/types/core/user/user';
import jexl from '@app/shared/jexl/get-configured-jexl';
import { isInlineItemsArraySchema } from '@app/shared/utils/schema-checks';
import ColumnAction from '@frontend/app/components/core/table/ColumnAction';
import ColumnActionsMenu from '@frontend/app/components/core/table/ColumnActionsMenu';
import { useGlobalStore } from '@frontend/hooks/use-global-store';
import { merge } from 'lodash/fp';
import Grid2 from '@mui/material/Grid';
import TopRightActions from '@frontend/app/components/core/actions/TopRightActions';
import BottomActions from '@frontend/app/components/core/actions/BottomActions';
import { normalizeUiSchema } from '@frontend/util/schema/normalize-ui-schema';
import { useEnv } from '@frontend/hooks/use-env';
import { PageRegistry } from '@frontend/app/pages';
import { PageMode } from '@cody-play/app/pages/PlayStandardPage';
import { showTitle } from '@frontend/util/schema/show-title';
import { informationTitle } from '@frontend/util/information/titelize';
import { ActionContainerInfo } from '@frontend/app/components/core/form/types/action';
import { EDropzoneId } from '@cody-play/app/types/enums/EDropzoneId';
import {Schema} from "@cody-play/infrastructure/vibe-cody/utils/schema/schema";
import {isActionsColumn} from "@cody-play/infrastructure/vibe-cody/utils/table/is-actions-column";
import {LiveEditModeContext} from "@cody-play/app/layout/PlayToggleLiveEditMode";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {Target} from "mdi-material-ui";
import {get} from "lodash";

const PlayTableView = (
  params: any,
  informationInfo: PlayInformationRuntimeInfo,
  pageMode: PageMode,
  hiddenView = false,
  uiSchemaOverride?: UiSchema,
  injectedInitialValues?: any
) => {
  if (
    !isQueryableStateListDescription(informationInfo.desc) &&
    !isQueryableListDescription(informationInfo.desc) &&
    !isQueryableNotStoredStateListDescription(informationInfo.desc)
  ) {
    throw new Error(
      `Play table view can only be used to show queriable state list information, but "${informationInfo.desc.name}" is not of this information type. ${CONTACT_PB_TEAM}`
    );
  }

  const theme = useTheme();
  const {
    config: { queries, types, pages, definitions, defaultService },
  } = useContext(configStore);
  const [page, addQueryResult] = usePageData();
  const [user] = useUser();
  const [store, setStore] = useGlobalStore();
  const normalizedDefaultService = names(defaultService).className;
  const env = useEnv();
  const { liveEditMode } = useContext(LiveEditModeContext);
  const [focusedEle, setFocusedEle] = useVibeCodyFocusElement();

  const jexlQueryCtx = {
    routeParams: params,
    user,
    page,
    store,
    data: {}
  };

  const mergedUiSchema = merge(informationInfo.uiSchema || {}, uiSchemaOverride || {});

  const queryParams = get(mergedUiSchema, 'ui:query', params);

  const query = useApiQuery(informationInfo.desc.query, normalizeUiSchema(queryParams, jexlQueryCtx, env));

  const jexlCtx = {
    routeParams: params,
    user,
    page,
    store,
    data: query.isSuccess ? query.data : {},
  };

  const uiSchema: UiSchema & TableUiSchema = normalizeUiSchema(
    mergedUiSchema,
    jexlCtx,
    env
  );
  const uiOptions = getUiOptions(uiSchema);

  // Normalize table uiSchema
  if (uiSchema['ui:table']) {
    uiSchema.table = uiSchema['ui:table'];
  }

  const pageSizeConfig = getTablePageSizeConfig(uiSchema);
  const density = getTableDensity(uiSchema);
  const hideToolbar = !!uiSchema.table?.hideToolbar;
  const checkboxSelection = !!uiSchema.table?.checkboxSelection;

  const itemIdentifier =
    isQueryableStateListDescription(informationInfo.desc) ||
    isQueryableNotStoredStateListDescription(informationInfo.desc)
      ? informationInfo.desc.itemIdentifier
      : undefined;

  let isHidden = hiddenView;

  if (!hiddenView && typeof uiSchema['ui:hidden'] !== 'undefined') {
    if (typeof uiSchema['ui:hidden'] === 'string') {
      isHidden = jexl.evalSync(uiSchema['ui:hidden'], jexlCtx);
    } else {
      isHidden = uiSchema['ui:hidden'];
    }
  }

  useEffect(() => {
    triggerSideBarAnchorsRendered();
  }, [params]);

  useEffect(() => {
    addQueryResult(registryIdToDataReference(informationInfo.desc.name), query);
  }, [params, query.dataUpdatedAt]);

  let columns: GridColDef[] = compileTableColumns(
    params,
    informationInfo,
    uiSchema,
    queries,
    pages,
    user,
    types,
    definitions,
    names(defaultService).className
  );

  if(liveEditMode) {
    columns = columns.map(c => ({
      ...c,
      ...(c.type === "actions" ? {width: 150} : {}),
      renderHeader: (colParams) => {

        const columnName = colParams.colDef.headerName || colParams.field;
        const focusedEleId = `${informationInfo.desc.name}:${colParams.field}`;

        const isFocusedEle = focusedEle && focusedEle.type === "tableColumn" && focusedEle.id === focusedEleId;

        return <Typography variant="h6">
          <IconButton onClick={() => setFocusedEle({
            id: focusedEleId,
            name: columnName,
            type: 'tableColumn',
          })} color={isFocusedEle ? 'info' : undefined}><Target /></IconButton>
          {columnName}
        </Typography>
      }
    }))
  } else {
    // Workaround to reset custom column header rendering when live edit mode is turned off
    columns = columns.map(c => ({...c, renderHeader: (colParams) => {
        if(!colParams.colDef.headerName) {
          return <></>
        }

        return <Typography variant="h6">
          {colParams.colDef.headerName}
        </Typography>
      }}))
  }

  if (isHidden) {
    return <></>;
  }

  const containerInfo: ActionContainerInfo = {
    name: informationInfo.desc.name,
    type: 'view',
  };

  const isFocusedEle = focusedEle && focusedEle.type === "table" && focusedEle.id === informationInfo.desc.name;

  return (
    <Box component="div">
      <Grid2 container={true}>
        <Grid2 size={'grow'}>
          {(showTitle(uiSchema) || liveEditMode) && (
            <Typography
              variant="h2"
              className="sidebar-anchor"
              id={'component-' + names(informationInfo.desc.name).fileName}
              sx={liveEditMode && !showTitle(uiSchema) ? {
                color: theme.palette.action.disabled,
                textDecoration: 'line-through',
                padding: (theme) => theme.spacing(4),
                paddingLeft: 0
              } : { padding: (theme) => theme.spacing(4), paddingLeft: 0 }}
            >
              {informationTitle(informationInfo, uiSchema)}
              {liveEditMode && <IconButton onClick={() => setFocusedEle({
                id: informationInfo.desc.name,
                name: informationTitle(informationInfo, uiSchema),
                type: 'table',
              })} color={isFocusedEle ? 'info' : undefined}><Target /></IconButton>}
            </Typography>
          )}
        </Grid2>
        <TopRightActions
          uiOptions={uiOptions}
          containerInfo={containerInfo}
          defaultService={normalizedDefaultService}
          jexlCtx={jexlCtx}
          dropzoneId={EDropzoneId.TABLE_TOP_ACTIONS_RIGHT}
          showDropzone
        />
      </Grid2>
      {query.isLoading && <CircularProgress />}
      {query.isSuccess && (
        <DataGrid
          columns={columns}
          rows={Array.isArray(query.data) ? query.data : [] }
          getRowId={(row) =>
            itemIdentifier ? row[itemIdentifier] : JSON.stringify(row)
          }
          sx={{ width: '100%' }}
          showToolbar={!hideToolbar}
          slots={{
            noRowsOverlay: NoRowsOverlay,
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: pageSizeConfig.pageSize },
            },
          }}
          disableColumnMenu={liveEditMode}
          pageSizeOptions={pageSizeConfig.pageSizeOptions}
          density={density}
          checkboxSelection={checkboxSelection}
          disableRowSelectionExcludeModel
          onRowSelectionModelChange={(model) => {
            const selectionDataReference =
              registryIdToDataReference(informationInfo.desc.name) +
              '/Selection';
            addQueryResult(selectionDataReference, Array.from(model.ids));
          }}
        />
      )}
      <BottomActions
        uiOptions={uiOptions}
        containerInfo={containerInfo}
        defaultService={normalizedDefaultService}
        jexlCtx={jexlCtx}
        dropzoneId={{
          left: EDropzoneId.TABLE_BOTTOM_ACTIONS_LEFT,
          center: EDropzoneId.TABLE_BOTTOM_ACTIONS_CENTER,
          right: EDropzoneId.TABLE_BOTTOM_ACTIONS_RIGHT,
        }}
        showDropzone={{ left: true, center: true, right: true }}
        sx={{ marginTop: theme.spacing(2) }}
      />
    </Box>
  );
};

export default PlayTableView;

type RefQueryMap = { [column: string]: UseQueryResult };

export const compileTableColumns = (
  params: any,
  information: PlayInformationRuntimeInfo,
  uiSchema: TableUiSchema,
  queries: PlayQueryRegistry,
  pages: PlayPageRegistry,
  user: User,
  types: PlayInformationRegistry,
  schemaDefinitions: PlaySchemaDefinitions,
  defaultService: string
): GridColDef[] => {
  const schema = information.schema;

  if (!isListSchema(schema) && !isInlineItemsArraySchema(schema)) {
    throw new Error(
      `Cannot render table. Schema of "${information.desc.name}" is not a list.`
    );
  }

  const itemSchema = resolveRefs(schema.items, schemaDefinitions);
  const wrappedItemSchema = new Schema(itemSchema, true);
  const itemUiSchema = getItemUiSchema(information, types);

  const columns = getColumns(
    information,
    uiSchema,
    itemSchema,
    itemUiSchema
  );

  const columnQueries: RefQueryMap = {};

  const gridColDefs: GridColDef[] = [];

  const getColValueWithExpr = (
    row: any,
    cValue: string | AnyRule[]
  ): any => {
    let ctx = { row, value: '', user };

    if (typeof cValue === 'string') {
      return jexl.evalSync(cValue, ctx);
    }

    const exe = makeSyncExecutable(cValue as AnyRule[]);

    ctx = exe(ctx);

    return ctx.value;
  };

  for (let column of columns) {
    // @TODO: Validate column

    if (typeof column === 'string') {
      column = {
        field: column,
      };
    }

    if (!column.field) {
      throw new Error(
        `Missing "field" property in a column definition. Every column needs to have at least a field property. Please check your configuration`
      );
    }

    const columnSchema = wrappedItemSchema.getObjectPropertySchema(column.field);

    if(columnSchema) {
      column = enrichColumnConfigFromSchema(
        column,
        (columnSchema as Schema).toJsonSchema(),
        itemUiSchema[column.field] || {},
        wrappedItemSchema.isRequired(column.field)
      );
    }

    if (!column['headerName'] && !isActionsColumn(column)) {
      column['headerName'] = camelCaseToTitle(column['field']);
    }

    if (!column['flex'] && !column['width'] && !isActionsColumn(column)) {
      column['flex'] = 1;
    }

    let hasValueGetter = false;

    let cKey: keyof TableColumnUiSchema;

    const gridColDef: Partial<GridColDef> = {};

    for (cKey in column) {
      const cValue = column[cKey];

      switch (cKey) {
        case 'action':
          const actionConfig = cValue as ActionTableColumn;

          if(column.type === "actions") {
            (gridColDef as GridActionsColDef).getActions = (rowParams) => {
              return [
                <ColumnAction
                  action={actionConfig}
                  row={rowParams.row}
                  defaultService={defaultService}
                  asGridActionsCellItem={true}
                  showInMenu={actionConfig.showInMenu}
                />
              ]
            }
            break;
          }

          gridColDef.renderCell = (rowParams) => (
            <ColumnAction
              action={actionConfig}
              row={rowParams.row}
              defaultService={defaultService}
            />
          );
          break;
        case 'actions':
          const actionConfigs = cValue as ActionTableColumn[];

          if(column.type === "actions") {
            (gridColDef as GridActionsColDef).getActions = (rowParams) => {
              return actionConfigs.map(aConfig => <ColumnAction
                action={aConfig}
                row={rowParams.row}
                defaultService={defaultService}
                asGridActionsCellItem={true}
                showInMenu={aConfig.showInMenu}
              />)
            }
            break;
          }

          gridColDef.renderCell = (rowParams) => (
            <div style={{ display: 'flex' }}>
              <ColumnActionsMenu
                actions={actionConfigs}
                row={rowParams.row}
                defaultService={defaultService}
              />
            </div>
          );
          break;
        case 'pageLink':
          const pageLinkConfig: PageLinkTableColumn =
            typeof cValue === 'string'
              ? {
                  page: cValue,
                  mapping: {},
                }
              : (cValue as PageLinkTableColumn);

          gridColDef.renderCell = (rowParams) => {
            if (pageLinkConfig['page:expr']) {
              pageLinkConfig.page = jexl.evalSync(pageLinkConfig['page:expr'], {
                ...params,
                ...rowParams,
              });
            }

            return (
              <PageLink
                page={getPageDefinition(
                  pageLinkConfig.page,
                  defaultService,
                  pages as unknown as PageRegistry
                )}
                params={mapProperties(
                  { ...params, ...rowParams.row },
                  pageLinkConfig.mapping
                )}
              >
                {rowParams.value}
              </PageLink>
            );
          };
          break;
        case 'value':
          gridColDef.valueGetter = (_, rowParams) => {
            return getColValueWithExpr(rowParams, cValue as any);
          };

          hasValueGetter = true;
          break;
        case 'ref':
          const refListVo = getVOFromTypes(
            (cValue as RefTableColumn).data,
            information.schema as JSONSchema7 & { $id: string },
            types
          );

          if (!refListVo) {
            throw new Error(
              `Cannot find Information "${
                (cValue as RefTableColumn).data
              }" configured in column ref of column: "${column.field}".`
            );
          }

          const refListDesc = refListVo.desc;

          if (
            !isQueryableStateListDescription(refListDesc) &&
            !isQueryableNotStoredStateListDescription(refListDesc) &&
            !isStoredQueryableListDescription(refListDesc)
          ) {
            throw new Error(
              `The ref in column "${column.field}" is not a list! Only lists can be used to load reference data.`
            );
          }

          let itemIdentifier = (cValue as RefTableColumn).itemIdentifier || '';

          if (!itemIdentifier) {
            if (
              !isQueryableStateListDescription(refListDesc) &&
              !isQueryableNotStoredStateListDescription(refListDesc)
            ) {
              throw new Error(
                `The ref in column "${column.field}" is not a list with an itemIdentifier! Either reference a list with an item identifier or configure one in the ref options!`
              );
            }

            itemIdentifier = refListDesc.itemIdentifier;
          }

          const columnQuery = queries[refListDesc.query];

          if (!columnQuery) {
            throw new Error(
              `Cannot resolve column ref of column "${column.field}". The query is unknown: "${refListDesc.query}". Did you forget to pass the corresponding information card to Cody?`
            );
          }

          if (!columnQueries[column.field]) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            columnQueries[column.field] = useApiQuery(
              columnQuery.desc.name,
              determineQueryPayload(
                params,
                columnQuery as unknown as QueryRuntimeInfo
              )
            );
          }

          const field = column.field;
          const expr = (cValue as RefTableColumn).value;

          gridColDef.valueGetter = (value, row) => {
            let rowParamsVal: any = value;

            if (typeof column !== 'string' && column['value']) {
              rowParamsVal = getColValueWithExpr({row}, column['value']);
            }

            return dataValueGetter(
              columnQueries[field],
              itemIdentifier,
              rowParamsVal,
              (data: any) => {
                let ctx = { data, value: '', user };

                if (typeof expr === 'string') {
                  return jexl.evalSync(expr, ctx);
                }

                const exe = makeSyncExecutable(expr as AnyRule[]);

                ctx = exe(ctx);

                return ctx.value;
              },
              (cValue as RefTableColumn).multiple
            );
          };

          hasValueGetter = true;
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gridColDef[cKey] = cValue;
      }
    }

    if (!hasValueGetter) {
      gridColDef.valueGetter = (value, params) => stringify(value);
    }

    gridColDefs.push(gridColDef as GridColDef);
  }

  return gridColDefs;
};

const getItemUiSchema = ({desc}: PlayInformationRuntimeInfo, types: PlayInformationRegistry): UiSchema => {
  const itemType = isListDescription(desc) ? desc.itemType : '';

  if(!types[itemType]) {
    return {}
  }

  return types[itemType].uiSchema || {};
}

const getVOFromTypes = (
  refOrFQCN: string,
  rootSchema: JSONSchema7 & { $id: string },
  types: PlayInformationRegistry
): PlayInformationRuntimeInfo | null => {
  if (refOrFQCN[0] === '/') {
    const rootId = rootSchema.$id || '';
    const definitionIdParts = rootId.replace('/definitions/', '').split('/');
    const service = names(definitionIdParts[0] || '').className;
    refOrFQCN = (service + refOrFQCN).split('/').join('.');
  }

  if (!types[refOrFQCN]) {
    return null;
  }

  return types[refOrFQCN];
};
