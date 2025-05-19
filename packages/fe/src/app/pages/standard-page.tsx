import {getPageTitle, PageDefinition, PageType, Tab} from "@frontend/app/pages/page-definitions";
import Grid2 from "@mui/material/Unstable_Grid2";
import {generatePath, useParams} from "react-router-dom";
import CommandBar, {renderTabs} from "@frontend/app/layout/CommandBar";
import {loadViewComponent} from "@frontend/util/components/load-view-components";
import {PageRegistry, pages} from "@frontend/app/pages/index";
import React, {useContext, useEffect, useMemo} from "react";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {useUser} from "@frontend/hooks/use-user";
import {Box, SxProps, Typography, useMediaQuery, useTheme} from "@mui/material";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useTranslation} from "react-i18next";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {execMappingSync} from "@app/shared/rule-engine/exec-mapping";
import {Action} from "@frontend/app/components/core/form/types/action";
import {parseActionsFromPageCommands} from "@frontend/app/components/core/form/types/parse-actions";
import {useEnv} from "@frontend/hooks/use-env";
import ActionButton from "@frontend/app/components/core/ActionButton";
import {environment} from "@frontend/environments/environment";
import {ViewComponentType} from "@cody-engine/cody/hooks/utils/ui/types";
import {UiSchema} from "@rjsf/utils";
import {ViewRuntimeConfig} from "@frontend/app/components/core/views/view-runtime-config";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import Breadcrumbs from "@frontend/app/layout/Breadcrumbs";
import {omit, merge} from "lodash";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";

interface Props {
  page: PageDefinition;
  mode?: PageType;
  drawerWidth?: number;
}

const findTabGroup = (groupName: string, pages: PageRegistry, routeParams: Readonly<Record<string, string>>): Tab[] => {
  return Object.values(pages).filter(p => p.tab && p.tab.group === groupName).map(p => {
    return {
      ...p.tab!,
      route: generatePath(p.route, routeParams)
    }
  });
}

export const StandardPage = (props: Props) => {
  const env = useEnv();
  const routeParams = useParams();
  const [user,] = useUser();
  const theme = useTheme();
  const [pageData,] = usePageData();
  const {t} = useTranslation();
  const [store] = useGlobalStore();
  const {reset} = useContext(PageDataContext);

  const copiedRouteParams = useMemo(() => {
    return cloneDeepJSON(routeParams);
  }, [routeParams]);

  const pageMode = props.mode || "standard";
  const page = {...props.page};

  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const isLarge = useMediaQuery(theme.breakpoints.up('xl'));
  const jexlCtx: FormJexlContext = {
    user,
    page: pageData,
    routeParams,
    store,
    data: {}
  }

  if(page['title:expr']) {
    page.title = jexl.evalSync(page['title:expr'], jexlCtx);
  }

  if(page['props:expr']) {
    page.props = execMappingSync(page['props:expr'], jexlCtx);
  }

  // @TODO: inject via config or theme
  let SIDEBAR_WIDTH = 300;

  if(!sideBarPersistent) {
    SIDEBAR_WIDTH = 0;
  }

  const headerGridSx: SxProps = {};

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  let tabs;
  let topBar: JSX.Element = <></>;
  let topActions: Action[] = [];
  let bottomActions: Action[] = [];

  if(page.tab) {
    tabs = findTabGroup(page.tab.group, pages, routeParams as Readonly<Record<string, string>>);
  }

  // Cmd Buttons are handled in the dialog component if mode is "dialog"
  const cmdBtns = pageMode === "dialog" || pageMode === "drawer" ? [] : parseActionsFromPageCommands(page.commands, jexlCtx, t, env)
    .filter(a => !a.button.hidden);

  if(environment.layout === "prototype") {
    topBar = cmdBtns.length > 0 || tabs ? <Grid2 xs={12}><CommandBar tabs={tabs}>
      {cmdBtns.map((a, index) => <ActionButton key={`${page.name}_action_${index}`} action={a} defaultService={env.DEFAULT_SERVICE} jexlCtx={jexlCtx} />)}
    </CommandBar></Grid2> : <></>;
  } else {
    topBar = tabs ? <Grid2 xs={12} sx={headerGridSx}>{renderTabs(tabs, user, pageData, theme, t, true)}</Grid2> : <></>;

    if(pageMode === "standard") {
      topActions = cmdBtns.filter(c => c.position === "top-right");
      bottomActions = cmdBtns.filter(c => c.position !== "top-right");
    }
  }

  const components = page.components.map((valueObjectName, index) => {
    let isHiddenView = false;
    let viewType: ViewComponentType = 'auto';
    let uiSchemaOverride: UiSchema | undefined;
    let loadState = true;
    let props: Record<string, any> | undefined;
    let initialValues: Record<string, any> | undefined;


    if(typeof valueObjectName !== "string") {
      viewType = valueObjectName.type || 'auto';
      uiSchemaOverride = valueObjectName.uiSchema;
      if(typeof valueObjectName.loadState !== "undefined") {
        loadState = valueObjectName.loadState;
      }
      props = valueObjectName.props;

      if(valueObjectName.data) {
        initialValues = execMappingSync(valueObjectName.data, jexlCtx);
      }

      if(valueObjectName['props:expr']) {
        props = execMappingSync(valueObjectName['props:expr'], {...jexlCtx, data: initialValues});
      }

      isHiddenView =  typeof valueObjectName['hidden:expr'] === "string" ? jexl.evalSync(valueObjectName['hidden:expr'], {...jexlCtx, data: initialValues}) : !!valueObjectName.hidden;

      if(valueObjectName['type:expr']) {
        viewType = jexl.evalSync(valueObjectName['type:expr'], {...jexlCtx, data: initialValues});
      }

      valueObjectName = valueObjectName.view;
    }

    const ViewComponent = loadViewComponent(valueObjectName);

    const containerProps = {xs: 12, className: "CodyView-root", ...(props?.container || {})};

    const runtimeConfig: ViewRuntimeConfig = {
      isHiddenView,
      viewType,
      pageMode,
      loadState,
      uiSchemaOverride,
      injectedInitialValues: initialValues,
    };

    // Merging this way is important here!
    // We need routeParams to keep its identity
    // otherwise react ends up in an endless update call insight the views
    // due to params being passed to useApiQuery()
    merge(copiedRouteParams, omit(props, 'container'));
    merge(copiedRouteParams, {hidden: isHiddenView});

    return <Grid2 key={'comp' + index} {...containerProps}>{ViewComponent(copiedRouteParams, runtimeConfig)}</Grid2>
  });


  const defaultContainerProps = {
    container: true,
    spacing: 3,
    sx: props.drawerWidth && isLarge ? {marginRight: props.drawerWidth + 'px'} : {},
    className: "CodyStandardPage-root"
  };

  return <Grid2 {...{...defaultContainerProps, ...page.props?.container, sx: {...defaultContainerProps.sx, ...page.props?.container?.sx}}}>
    {environment.layout === 'task-based-ui'
      && pageMode === "standard"
      && <>
        <Grid2 xs={12} sx={headerGridSx}><Breadcrumbs /></Grid2>
        <Grid2 xs sx={headerGridSx}>
          <Typography variant="h1" className="CodyPageTitle-root">{getPageTitle(page as unknown as PageDefinition)}</Typography></Grid2>
        <TopRightActions actions={topActions} uiOptions={{}} defaultService={env.DEFAULT_SERVICE} jexlCtx={jexlCtx} />
      </>}
    {topBar}
    <Grid2 xs={12} sx={{padding: 0}} />
    {components}
    { /*Render a placeholder to keep space for the  bottom bar */ }
    {environment.layout === 'task-based-ui' && pageMode === 'standard' && bottomActions.length > 0 && <Box sx={{
      width: props.drawerWidth && isLarge ? `calc(100% - ${SIDEBAR_WIDTH}px - ${props.drawerWidth}px)` : `calc(100% - ${SIDEBAR_WIDTH}px)`,
      left: SIDEBAR_WIDTH + 'px',
      bottom: 0,
      marginTop: theme.spacing(2),
      height: '60px'
    }} />}
    {environment.layout === 'task-based-ui' && pageMode === 'standard' && bottomActions.length > 0 && <Box sx={{
      position: "fixed",
      width: props.drawerWidth && isLarge ? `calc(100% - ${SIDEBAR_WIDTH}px - ${props.drawerWidth}px)` : `calc(100% - ${SIDEBAR_WIDTH}px)`,
      backgroundColor: (theme) => theme.palette.grey.A100,
      borderTop: (theme) => '1px solid ' + theme.palette.grey.A200,
      left: SIDEBAR_WIDTH + 'px',
      bottom: 0,
      zIndex: theme.zIndex.appBar,
    }}>
      <BottomActions uiOptions={{}} defaultService={env.DEFAULT_SERVICE} jexlCtx={jexlCtx} actions={bottomActions} sx={{padding: `${theme.spacing(3)} ${theme.spacing(4)}`}} />
    </Box>}
  </Grid2>
}
