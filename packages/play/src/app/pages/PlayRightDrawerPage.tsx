import * as React from 'react';
import {Box, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, Toolbar, useTheme} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {names} from "@event-engine/messaging/helpers";
import {getMainPage, getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {PageRegistry} from "@frontend/app/pages";
import {PlayStandardPage} from "@cody-play/app/pages/PlayStandardPage";
import {generatePageLink} from "@frontend/app/components/core/PageLink";
import {Close} from "mdi-material-ui";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {useEnv} from "@frontend/hooks/use-env";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useTranslation} from "react-i18next";
import Grid2 from "@mui/material/Grid";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {parseActionsFromPageCommands} from "@frontend/app/components/core/form/types/parse-actions";
import {ActionContainerInfo, isButtonAction} from "@frontend/app/components/core/form/types/action";

interface OwnProps {
  page: string;
}

type PlayRightDrawerPageProps = OwnProps;

const drawerWidth = 500;


const PlayRightDrawerPage = (props: PlayRightDrawerPageProps) => {
  const env = useEnv();
  const theme = useTheme();
  const routeParams = useParams();
  const pageMatch = usePageMatch();
  const [user,] = useUser();
  const [store] = useGlobalStore();
  const [pageData,] = usePageData();
  const {config} = useContext(configStore);
  const {reset} = useContext(PageDataContext);
  const defaultService = names(config.defaultService).className;
  const navigate = useNavigate();
  const {t} = useTranslation();

  const jexlCtx: FormJexlContext = {
    user,
    page: pageData,
    routeParams,
    store,
    data: {},
    mode: "pageForm"
  }

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  const page = config.pages[props.page];
  const mainPage = getMainPage(page as unknown as PageDefinition, config.pages as unknown as PageRegistry, defaultService);

  const actionBtns = parseActionsFromPageCommands(page.commands, jexlCtx, t, env).filter(a => !isButtonAction(a) || !a.button.hidden);

  const bottomActions = actionBtns.filter(a => a.position !== "top-right")
  const topRightActions = actionBtns.filter(a => a.position === "top-right")

  const handleClose = () => {
    navigate(generatePageLink(mainPage, routeParams));
  };

  const containerInfo: ActionContainerInfo = {
    name: page.name,
    type: "page"
  }

  return <>
    <PlayStandardPage page={mainPage.name} drawerWidth={drawerWidth} />
    <Drawer anchor="right"
            open={true}
            onClose={handleClose}
            variant="persistent"
            sx={{
              width: drawerWidth,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', overflowX: "hidden" },
            }}
    >
      <Toolbar />
      <DialogTitle>
        <Grid2 container={true}>
          <Grid2 size={'grow'}>
            {getPageTitle(page as unknown as PageDefinition)}
          </Grid2>
          {topRightActions.length
            ? <TopRightActions actions={topRightActions}
                               containerInfo={containerInfo}
                               uiOptions={{}}
                               defaultService={defaultService}
                               jexlCtx={jexlCtx} />
            : <Grid2 size={'grow'}
                     display="flex"
                     direction="column"
                     alignItems="center"
                     justifyContent="flex-end">
              <IconButton sx={{
                marginRight: `-${theme.spacing(1)}`,
                color: theme.palette.grey[500],
              }} onClick={handleClose}>
                <Close />
              </IconButton>
            </Grid2>
          }
        </Grid2>
      </DialogTitle>
      <DialogContent><PlayStandardPage page={page.name} mode="drawer" /></DialogContent>
      {bottomActions.length > 0 && <BottomActions actions={bottomActions}
                                                  containerInfo={containerInfo}
                                                  uiOptions={{}}
                                                  defaultService={defaultService}
                                                  jexlCtx={jexlCtx}
                                                  sx={{padding: theme.spacing(3)}} />}
    </Drawer>
  </>
};

export default PlayRightDrawerPage;
