import Grid2 from "@mui/material/Unstable_Grid2";
import {generatePath, useParams} from "react-router-dom";
import CommandBar, {renderTabs} from "@frontend/app/layout/CommandBar";
import React, {useContext, useEffect} from "react";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import PlayCommand from "@cody-play/app/components/core/PlayCommand";
import {
  PlayInformationRegistry,
  PlayPageDefinition,
  PlayPageRegistry,
  PlayViewComponentConfig
} from "@cody-play/state/types";
import {
  isQueryableDescription,
  isQueryableListDescription, isQueryableNotStoredStateListDescription,
  isQueryableStateListDescription
} from "@event-engine/descriptions/descriptions";
import PlayTableView from "@cody-play/app/components/core/PlayTableView";
import PlayStateView from "@cody-play/app/components/core/PlayStateView";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {getPageTitle, PageDefinition, Tab} from "@frontend/app/pages/page-definitions";
import {Alert, Box, DialogActions, SxProps, Tabs, Typography, useMediaQuery, useTheme} from "@mui/material";
import {playIsCommandButtonHidden} from "@cody-play/infrastructure/cody/command/play-is-command-button-hidden";
import PlayStaticView from "@cody-play/app/components/core/PlayStaticView";
import {names} from "@event-engine/messaging/helpers";
import PlayStateFormView from "@cody-play/app/components/core/PlayStateFormView";
import {ViewComponentType} from "@cody-engine/cody/hooks/utils/ui/types";
import {UiSchema} from "@rjsf/utils";
import PlayNewStateFormView from "@cody-play/app/components/core/PlayNewStateFormView";
import PlayConnectedCommand from "@cody-play/app/components/core/PlayConnectedCommand";
import PlayBreadcrumbs from "@cody-play/app/layout/PlayBreadcrumbs";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useTranslation} from "react-i18next";

interface Props {
  page: string;
  mode?: 'standard' | 'dialog';
  drawerWidth?: number;
}

const findTabGroup = (groupName: string, pages: PlayPageRegistry, routeParams: Readonly<Record<string, string>>): Tab[] => {
  return Object.values(pages).filter(p => p.tab && p.tab.group === groupName).map(p => {
    return {
      ...p.tab!,
      route: generatePath(p.route, routeParams)
    }
  });
}


export const PlayStandardPage = (props: Props) => {
  const routeParams = useParams();
  const pageMatch = usePageMatch();
  const {config} = useContext(configStore);
  const {reset} = useContext(PageDataContext);
  const defaultService = names(config.defaultService).className;
  const [user,] = useUser();
  const theme = useTheme();
  const [pageData,] = usePageData();
  const {t} = useTranslation();
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });
  const isLarge = useMediaQuery(theme.breakpoints.up('xl'));


  // @TODO: inject via config or theme
  let SIDEBAR_WIDTH = 300;

  if(!sideBarPersistent) {
    SIDEBAR_WIDTH = 0;
  }

  const headerGridSx: SxProps = {paddingTop: 0, paddingBottom: 0};

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  const page = config.pages[props.page];

  // Cmd Buttons are handled in the dialog component if mode is "dialog"
  const cmdBtns = props.mode === "dialog" ? [] : getCommandButtons(page, config);

  let tabs;

  if(page.tab) {
    tabs = findTabGroup(page.tab.group, config.pages, routeParams as Readonly<Record<string, string>>);
  }

  const commandBar = config.layout === "prototype"
    ? cmdBtns.length || tabs ? <Grid2 xs={12}><CommandBar tabs={tabs}>{cmdBtns}</CommandBar></Grid2> : <></>
    : tabs ? <Grid2 xs={12} sx={headerGridSx}>{renderTabs(tabs, user, pageData, theme, t, true)}</Grid2> : <></>

  const components = page.components.map((valueObjectName, index) => {
    let isHiddenView = false;
    let viewType: ViewComponentType = 'auto';
    let uiSchemaOverride: UiSchema | undefined;
    let loadState = true;

    if(typeof valueObjectName !== "string") {
      isHiddenView = !!valueObjectName.hidden;
      viewType = valueObjectName.type || 'auto';
      uiSchemaOverride = valueObjectName.uiSchema;
      if(typeof valueObjectName.loadState !== "undefined") {
        loadState = valueObjectName.loadState;
      }

      valueObjectName = valueObjectName.view;
    }

    if(!config.views[valueObjectName]) {
      throw new Error(`View Component for Information: "${valueObjectName}" is not registered. Did you forget to pass the corresponding Information card to Cody?`);
    }

    const ViewComponent = getViewComponent(config.views[valueObjectName], config.types, isHiddenView, viewType, uiSchemaOverride, loadState);

    return <Grid2 key={'comp' + index} xs={12}>{ViewComponent(routeParams)}</Grid2>
  });

  return <Grid2 container={true} spacing={3} sx={props.drawerWidth && isLarge ? {marginRight: props.drawerWidth + 'px'} : {}}>
    {config.layout === 'task-based-ui'
      && props.mode !== "dialog"
      && <>
        <Grid2 xs={12} sx={headerGridSx}><PlayBreadcrumbs /></Grid2>
        <Grid2 xs={12} sx={headerGridSx}><Typography variant="h2">{getPageTitle(page as unknown as PageDefinition)}</Typography></Grid2>
      </>}
    {commandBar}
    {components}
    { /*Render a placeholder to keep space for the  bottom bar */ }
    {config.layout === 'task-based-ui' && props.mode !== 'dialog' && cmdBtns.length && <Box sx={{
      width: props.drawerWidth && isLarge ? `calc(100% - ${SIDEBAR_WIDTH}px - ${props.drawerWidth}px)` : `calc(100% - ${SIDEBAR_WIDTH}px)`,
      padding: (theme) => theme.spacing(2) + " " + theme.spacing(4),
      left: SIDEBAR_WIDTH + 'px',
      bottom: 0,
    }}>
      <DialogActions />
    </Box>}
    {config.layout === 'task-based-ui' && props.mode !== 'dialog' && cmdBtns.length && <Box sx={{
      position: "fixed",
      width: props.drawerWidth && isLarge ? `calc(100% - ${SIDEBAR_WIDTH}px - ${props.drawerWidth}px)` : `calc(100% - ${SIDEBAR_WIDTH}px)`,
      padding: (theme) => theme.spacing(2) + " " + theme.spacing(4),
      backgroundColor: (theme) => theme.palette.grey.A100,
      borderTop: (theme) => '1px solid ' + theme.palette.grey.A200,
      left: SIDEBAR_WIDTH + 'px',
      bottom: 0,
    }}>
      <DialogActions>
        {cmdBtns}
      </DialogActions>
    </Box>}
  </Grid2>
}

export const getCommandButtons = (page: PlayPageDefinition, config: CodyPlayConfig): JSX.Element[] => {
  return page.commands
    .filter(commandName => {
      if(typeof commandName !== "string") {
        commandName = commandName.command;
      }


      const cmd = config.commands[commandName as string];

      if(!cmd) {
        return true; // Fallthrough to map to Alert message
      }

      return !playIsCommandButtonHidden(cmd);
    })
    .map((commandName,index) => {

      let uiSchemaOverride: UiSchema | undefined;
      let forceSchema = false;
      let connectTo: string | undefined;

      if(typeof commandName !== "string") {
        uiSchemaOverride = commandName.uiSchema;
        forceSchema = !!commandName.forceSchema;
        connectTo = commandName.connectTo;
        commandName = commandName.command;
      }

      const cmd = config.commands[commandName as string];

      if(!cmd) {
        return <Alert severity="error">{`Command "${commandName}" not found! You have to pass the command to Cody on prooph board.`}</Alert>
      }

      if(connectTo) {
        return <PlayConnectedCommand key={commandName} command={config.commands[commandName as string]} connectTo={connectTo} forceSchema={forceSchema} uiSchemaOverride={uiSchemaOverride} />
      }

      return <PlayCommand key={commandName} command={config.commands[commandName as string]} uiSchemaOverride={uiSchemaOverride} />
    });
}

const getViewComponent = (component: React.FunctionComponent | PlayViewComponentConfig, types: PlayInformationRegistry, isHiddenView = false, viewType: ViewComponentType, uiSchemaOverride?: UiSchema, loadState = true): React.FunctionComponent => {
  if(typeof component === "object" && component.information) {
    const information = types[component.information];

    if(!information) {
      throw new Error(`Cannot find view information "${component.information}". Did you forget to run Cody for information card?`)
    }

    if(isQueryableStateListDescription(information.desc) || isQueryableListDescription(information.desc) || isQueryableNotStoredStateListDescription(information.desc)) {
      return (params: any) => {
        return PlayTableView(params, information, isHiddenView, uiSchemaOverride);
      };
    } else if (isQueryableDescription(information.desc) && loadState) {
      return (params: any) => {
        return viewType === 'form'
          ? PlayStateFormView(params, information, isHiddenView, uiSchemaOverride)
          : PlayStateView(params, information, isHiddenView, uiSchemaOverride);
      }
    } else {
      return (params: any) => {
        return viewType === 'form'
          ? PlayNewStateFormView(params, information, isHiddenView, uiSchemaOverride)
          : PlayStaticView(params, information, isHiddenView, uiSchemaOverride);
      }
    }
  }

  return component as React.FunctionComponent;
}
