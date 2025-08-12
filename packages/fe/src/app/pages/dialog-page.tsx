import * as React from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {useContext, useEffect} from "react";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {getMainPage, getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {pages} from "@frontend/app/pages";
import {Dialog, DialogContent, DialogTitle, IconButton, useTheme} from "@mui/material";
import {Close} from "mdi-material-ui";
import {generatePageLink} from "@frontend/app/components/core/PageLink";
import {useEnv} from "@frontend/hooks/use-env";
import {useUser} from "@frontend/hooks/use-user";
import {useGlobalStore} from "@frontend/hooks/use-global-store";
import {useTranslation} from "react-i18next";
import {FormJexlContext} from "@frontend/app/components/core/form/types/form-jexl-context";
import {usePageData} from "@frontend/hooks/use-page-data";
import Grid2 from "@mui/material/Unstable_Grid2";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import BottomActions from "@frontend/app/components/core/actions/BottomActions";
import {parseActionsFromPageCommands} from "@frontend/app/components/core/form/types/parse-actions";
import {StandardPage} from "@frontend/app/pages/standard-page";
import {isButtonAction} from "@frontend/app/components/core/form/types/action";

interface OwnProps {
  page: PageDefinition;
}

type DialogPageProps = OwnProps;

const DialogPage = (props: DialogPageProps) => {
  const env = useEnv();
  const theme = useTheme();
  const routeParams = useParams();
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
    data: {},
    mode: "dialogForm"
  }

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  const page = props.page;
  const mainPage = getMainPage(page, pages, defaultService);

  const actionBtns = parseActionsFromPageCommands(page.commands, jexlCtx, t, env).filter(a => !isButtonAction(a) || !a.button.hidden);

  const bottomActions = actionBtns.filter(a => a.position !== "top-right")
  const topRightActions = actionBtns.filter(a => a.position === "top-right")

  const handleClose = () => {
    navigate(generatePageLink(mainPage, routeParams));
  };

  return <>
    <StandardPage page={mainPage} />
    <Dialog open={true} fullWidth={true} maxWidth={'lg'} onClose={handleClose} sx={{"& .MuiDialog-paper": {minHeight: "50%"}}}>
      <DialogTitle>
        <Grid2 container={true}>
          <Grid2 xs>
            {getPageTitle(page)}
          </Grid2>
          {topRightActions.length
            ? <TopRightActions actions={topRightActions}  uiOptions={{}} defaultService={defaultService} jexlCtx={jexlCtx} />
            : <Grid2 xs
                     display="flex"
                     direction="column"
                     alignItems="center"
                     justifyContent="flex-end">
              <IconButton sx={{
                marginRight: `-${theme.spacing(2)}`,
                color: theme.palette.grey[500],
              }} onClick={handleClose}>
                <Close />
              </IconButton>
            </Grid2>
          }
        </Grid2>
      </DialogTitle>
      <DialogContent>
        <StandardPage page={page} mode="dialog" />
      </DialogContent>
      {bottomActions.length > 0 && <BottomActions sx={{padding: theme.spacing(3)}} actions={bottomActions} uiOptions={{}} defaultService={defaultService} jexlCtx={jexlCtx} />}
    </Dialog>
  </>
};

export default DialogPage;
