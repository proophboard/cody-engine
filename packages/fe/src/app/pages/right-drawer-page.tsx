import * as React from 'react';
import {DialogContent, DialogTitle, Drawer, IconButton, Toolbar, useTheme} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useContext, useEffect} from "react";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {getMainPage, getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {pages} from "@frontend/app/pages";
import {generatePageLink} from "@frontend/app/components/core/PageLink";
import {Close} from "mdi-material-ui";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {useEnv} from "@frontend/hooks/use-env";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {usePageData} from "@frontend/hooks/use-page-data";
import {useTranslation} from "react-i18next";
import Grid2 from "@mui/material/Unstable_Grid2";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {parseActionsFromPageCommands} from "@frontend/app/components/core/form/types/parse-actions";
import {StandardPage} from "@frontend/app/pages/standard-page";

interface OwnProps {
  page: PageDefinition;
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
  const {reset} = useContext(PageDataContext);
  const defaultService = env.DEFAULT_SERVICE;
  const navigate = useNavigate();
  const {t} = useTranslation();

  const jexlCtx: FormJexlContext = {
    user,
    page: pageData,
    routeParams,
    store,
    data: {}
  }

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  const page = props.page;
  const mainPage = getMainPage(page, pages, defaultService);

  const actionBtns = parseActionsFromPageCommands(page.commands, jexlCtx, t, env).filter(a => !a.button.hidden);

  const bottomActions = actionBtns.filter(a => a.position !== "top-right")
  const topRightActions = actionBtns.filter(a => a.position === "top-right")

  const handleClose = () => {
    navigate(generatePageLink(mainPage, routeParams));
  };

  return <>
    <StandardPage page={mainPage} drawerWidth={drawerWidth} />
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
          <Grid2 xs>
            {getPageTitle(page as unknown as PageDefinition)}
          </Grid2>
          {topRightActions.length
            ? <TopRightActions actions={topRightActions}  uiOptions={{}} defaultService={defaultService} jexlCtx={jexlCtx} />
            : <Grid2 xs
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
      <DialogContent><StandardPage page={page} mode="drawer" /></DialogContent>
      {bottomActions.length > 0 && <BottomActions actions={bottomActions} uiOptions={{}} defaultService={defaultService} jexlCtx={jexlCtx} sx={{padding: theme.spacing(3)}} />}
    </Drawer>
  </>
};

export default PlayRightDrawerPage;
