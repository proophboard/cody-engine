import {ValueObjectRuntimeInfo} from "@event-engine/messaging/value-object";
import {ViewRuntimeConfig} from "@frontend/app/components/core/views/view-runtime-config";
import {useEnv} from "@frontend/hooks/use-env";
import {Box, CircularProgress, Typography, useTheme} from "@mui/material";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {names} from "@event-engine/messaging/helpers";
import {merge} from "lodash/fp";
import {get} from "lodash";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {getUiOptions, UiSchema} from "@rjsf/utils";
import {TableUiSchema} from "@cody-engine/cody/hooks/utils/value-object/types";
import {getTableDensity, getTablePageSizeConfig} from "@cody-play/infrastructure/ui-table/utils";
import {
  isQueryableListDescription,
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription, QueryableListDescription
} from "@event-engine/descriptions/descriptions";
import jexl from "@app/shared/jexl/get-configured-jexl";
import React, {useEffect} from "react";
import {triggerSideBarAnchorsRendered} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import {DataGrid, GridColDef, GridToolbar} from "@mui/x-data-grid";
import {compileTableColumns} from "@cody-play/app/components/core/PlayTableView";
import {
  PlayInformationRegistry,
  PlayInformationRuntimeInfo,
  PlayPageRegistry,
  PlayQueryRegistry, PlaySchemaDefinitions
} from "@cody-play/state/types";
import {queries} from "@app/shared/queries";
import {pages} from "@frontend/app/pages";
import {types} from "@app/shared/types";
import definitions from "@app/shared/types/definitions";
import Grid2 from "@mui/material/Grid";
import {showTitle} from "@frontend/util/schema/show-title";
import {informationTitle} from "@frontend/util/information/titelize";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import NoRowsOverlay from "@frontend/app/components/core/table/NoRowsOverlay";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import StateView from "@frontend/app/components/core/StateView";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";

export const makeStandardListViewComponent = (information: ValueObjectRuntimeInfo) => {
  if (
    !isQueryableStateListDescription(information.desc) &&
    !isQueryableListDescription(information.desc) &&
    !isQueryableNotStoredStateListDescription(information.desc)
  ) {
    throw new Error(
      `Play table view can only be used to show queriable state list information, but "${information.desc.name}" is not of this information type.`
    );
  }


  return (params: object & {hidden?: boolean}, config: ViewRuntimeConfig) => {
    const env = useEnv();
    const theme = useTheme();
    const [user] = useUser();
    const [page, addQueryResult] = usePageData();
    const [store, setStore] = useGlobalStore();
    const normalizedDefaultService = names(env.DEFAULT_SERVICE).className;

    const mergedUiSchema = merge(
      information.uiSchema || {},
      config.uiSchemaOverride || {}
    );
    // Get items UI schema from original (not normalized) ui schema, so that expr tags can be evaluated in the context of each item
    const itemsUiSchema = get(mergedUiSchema, 'ui:list.items', {});

    // Prepare the main query
    const queryParams = get(mergedUiSchema, 'ui:query', params);

    const jexlQueryCtx = {
      theme,
      routeParams: params,
      user,
      page,
      store,
      data: {},
    };

    const query = useApiQuery(
      (information.desc as QueryableListDescription).query,
      normalizeUiSchema(queryParams, jexlQueryCtx, env),
      {},
      !config.loadState
    );

    const jexlCtx = {
      theme,
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

    let isHidden = config.isHiddenView;

    if (!config.isHiddenView && typeof uiSchema['ui:hidden'] !== 'undefined') {
      if (typeof uiSchema['ui:hidden'] === 'string') {
        isHidden = jexl.evalSync(uiSchema['ui:hidden'], jexlCtx);
      } else {
        isHidden = uiSchema['ui:hidden'];
      }
    }

    const itemIdentifier =
      isQueryableStateListDescription(information.desc) ||
      isQueryableNotStoredStateListDescription(information.desc)
        ? information.desc.itemIdentifier
        : undefined;

    useEffect(() => {
      triggerSideBarAnchorsRendered();
    }, [params]);

    useEffect(() => {
      addQueryResult(registryIdToDataReference(information.desc.name), query);
    }, [params, query.dataUpdatedAt]);

    if (isHidden) {
      return <></>;
    }

    if (config.viewType === 'list') {
      // Prepare infos for list view
      const listGridProps = get(uiSchema, 'ui:list.ui:options.container.props', {});
      const itemGridProps = normalizeUiSchema(
        get(cloneDeepJSON(itemsUiSchema), 'ui:options.grid.props', { xs: 12 }),
        jexlCtx,
        env
      );
      const itemInfo =
        types[(information.desc as QueryableListDescription).itemType];


      return (
        <Box component="div">
          <Grid2 container={true}>
            <Grid2 size={'grow'}>
              {showTitle(uiSchema) && (
                <Typography
                  variant="h2"
                  className="sidebar-anchor"
                  id={`component-${names(information.desc.name).fileName}`}
                  sx={{ padding: (theme) => theme.spacing(4), paddingLeft: 0 }}
                >
                  {informationTitle(information, uiSchema)}
                </Typography>
              )}
            </Grid2>
            <TopRightActions
              uiOptions={uiOptions}
              defaultService={normalizedDefaultService}
              jexlCtx={jexlCtx}
            />
          </Grid2>
          {query.isLoading && <CircularProgress />}
          {query.isSuccess && (
            <Grid2
              container={true}
              className="CodyListView-grid"
              {...listGridProps}
            >
              {Array.isArray(query.data) && query.data.map((item: any, itemIndex: number) => (
                <Grid2 key={item[(itemIdentifier || `list-item-${itemIndex}`)]} {...itemGridProps}>
                  <StateView
                    mode={'listView'}
                    description={{
                      ...itemInfo,
                      uiSchema: merge(itemInfo.uiSchema || {}, itemsUiSchema),
                    }}
                    state={item}
                  />
                </Grid2>
              ))}
            </Grid2>
          )}
          <BottomActions
            uiOptions={uiOptions}
            defaultService={normalizedDefaultService}
            jexlCtx={jexlCtx}
            sx={{ marginTop: theme.spacing(2) }}
          />
        </Box>
      );
    }

    // Normalize table uiSchema
    if (uiSchema['ui:table']) {
      uiSchema.table = uiSchema['ui:table'];
    }

    const pageSizeConfig = getTablePageSizeConfig(uiSchema);
    const density = getTableDensity(uiSchema);
    const hideToolbar = !!uiSchema.table?.hideToolbar;
    const checkboxSelection = !!uiSchema.table?.checkboxSelection;

    const columns: GridColDef[] = compileTableColumns(
      params,
      information as unknown as PlayInformationRuntimeInfo,
      uiSchema,
      queries as unknown as PlayQueryRegistry,
      pages as unknown as PlayPageRegistry,
      user,
      types as unknown as PlayInformationRegistry,
      definitions as unknown as PlaySchemaDefinitions,
      normalizedDefaultService
    );

    // Return default table view
    return (
      <Box component="div">
        <Grid2 container={true}>
          <Grid2 size={'grow'}>
            {showTitle(uiSchema) && (
              <Typography
                variant="h2"
                className="sidebar-anchor"
                sx={{ padding: (theme) => theme.spacing(4), paddingLeft: 0 }}
                id={'component-app-my-projects'}
              >
                {informationTitle(information, uiSchema)}
              </Typography>
            )}
          </Grid2>
          <TopRightActions
            uiOptions={uiOptions}
            defaultService={normalizedDefaultService}
            jexlCtx={jexlCtx}
          />
        </Grid2>
        {query.isLoading && <CircularProgress />}
        {query.isSuccess && (
          <DataGrid
            columns={columns}
            rows={Array.isArray(query.data) ? query.data : []}
            getRowId={(row) =>
              itemIdentifier ? row[itemIdentifier] : JSON.stringify(row)
            }
            sx={{ width: '100%' }}
            slots={{
              toolbar: hideToolbar ? undefined : GridToolbar,
              noRowsOverlay: NoRowsOverlay,
            }}
            initialState={{ pagination: { paginationModel: { pageSize: pageSizeConfig.pageSize }, } }}
            pageSizeOptions={pageSizeConfig.pageSizeOptions}
            density={density}
            checkboxSelection={checkboxSelection}
            disableRowSelectionExcludeModel
            onRowSelectionModelChange={(model) => {
              const selectionDataReference =
                registryIdToDataReference(information.desc.name) +
                '/Selection';
              addQueryResult(selectionDataReference, Array.from(model.ids));
            }}
          />
        )}
        <BottomActions
          uiOptions={uiOptions}
          defaultService={normalizedDefaultService}
          jexlCtx={jexlCtx}
          sx={{ marginTop: theme.spacing(2) }}
        />
      </Box>
    );
  }
}
