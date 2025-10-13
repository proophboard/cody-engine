import * as React from 'react';
import {PlayInformationRuntimeInfo} from "@cody-play/state/types";
import {PageMode} from "@cody-play/app/pages/PlayStandardPage";
import {getUiOptions, UiSchema} from "@rjsf/utils";
import {
  isQueryableListDescription,
  isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription, isStateDescription
} from "@event-engine/descriptions/descriptions";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {Alert, Box, CircularProgress, IconButton, Typography, useTheme} from "@mui/material";
import {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {names} from "@event-engine/messaging/helpers";
import {useEnv} from "@frontend/hooks/use-env";
import {LiveEditModeContext} from "@cody-play/app/layout/PlayToggleLiveEditMode";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {useApiQuery} from "@frontend/queries/use-api-query";
import {normalizeUiSchema} from "@frontend/util/schema/normalize-ui-schema";
import {merge} from "lodash/fp";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {triggerSideBarAnchorsRendered} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";
import {registryIdToDataReference} from "@app/shared/utils/registry-id-to-data-reference";
import Grid2 from "@mui/material/Grid";
import {showTitle} from "@frontend/util/schema/show-title";
import {informationTitle} from "@frontend/util/information/titelize";
import {Target} from "mdi-material-ui";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import {EDropzoneId} from "@cody-play/app/types/enums/EDropzoneId";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {get} from "lodash";
import {ActionContainerInfo} from "@frontend/app/components/core/form/types/action";
import PlayStaticView from "@cody-play/app/components/core/PlayStaticView";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";

interface OwnProps {

}

type PlayListViewProps = OwnProps;

const PlayListView = (
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
      `Play list view can only be used to show queriable state list information, but "${informationInfo.desc.name}" is not of this information type. ${CONTACT_PB_TEAM}`
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
  // Get items UI schema from original (not normalized) ui schema, so that expr tags can be evaluated in the context of each item
  const itemsUiSchema = get(mergedUiSchema, 'ui:list.items', {});

  const queryParams = get(mergedUiSchema, 'ui:query', params);

  const query = useApiQuery(informationInfo.desc.query, normalizeUiSchema(queryParams, jexlQueryCtx, env));

  const jexlCtx = {
    routeParams: params,
    user,
    page,
    store,
    theme,
    data: query.isSuccess ? query.data : {},
  };

  const uiSchema: UiSchema = normalizeUiSchema(
    mergedUiSchema,
    jexlCtx,
    env
  );

  const uiOptions = getUiOptions(uiSchema);

  const listGridProps = get(uiSchema, 'ui:list.ui:options.container.props', {});
  const itemGridProps = normalizeUiSchema(
    get(cloneDeepJSON(itemsUiSchema), 'ui:options.grid.props', {xs: 12}),
    jexlCtx,
    env
  );

  const itemPageMode = get(
    normalizeUiSchema(cloneDeepJSON(itemsUiSchema as UiSchema), jexlCtx, env),
    'ui:options.pageMode', "list"
  ) as PageMode;

  const itemInfo = types[informationInfo.desc.itemType];

  const itemIdentifier =
    isQueryableStateListDescription(informationInfo.desc) ||
    isQueryableNotStoredStateListDescription(informationInfo.desc)
      ? informationInfo.desc.itemIdentifier
      : isStateDescription(itemInfo.desc) ? itemInfo.desc.identifier : undefined;

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

  if (isHidden) {
    return <></>;
  }

  if(!itemInfo) {
    return <Alert severity="error">{`Item information "${informationInfo.desc.itemType}" cannot be found in the Cody Play types config. Did you forget to pass the information to Cody Play?`}</Alert>
  }

  if(!itemIdentifier) {
    return <Alert severity="error">{`Item information "${informationInfo.desc.itemType}" cannot be rendered in a list. It has no "identifier" configured, which is mandatory for list rendering.`}</Alert>
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
        <Grid2 container={true} className="CodyListView-grid" {...listGridProps}>
          {Array.isArray(query.data) && query.data.map((item: any) => <Grid2 key={item[itemIdentifier]} {...itemGridProps}>{PlayStaticView(params, itemInfo, itemPageMode, false, itemsUiSchema, item)}</Grid2>)}
        </Grid2>
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

export default PlayListView;
