import * as React from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {names} from "@event-engine/messaging/helpers";
import {getMainPage, getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {PageRegistry} from "@frontend/app/pages";
import {PlayStandardPage} from "@cody-play/app/pages/PlayStandardPage";
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

interface OwnProps {
  page: string;
}

type PlayDialogPageProps = OwnProps;

const PlayDialogPage = (props: PlayDialogPageProps) => {
  const env = useEnv();
  const theme = useTheme();
  const routeParams = useParams();
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
    data: {}
  }

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  const page = config.pages[props.page];
  const mainPage = getMainPage(page as unknown as PageDefinition, config.pages as unknown as PageRegistry, defaultService);

  const actionBtns = parseActionsFromPageCommands(page.commands, jexlCtx, t, env).filter(a => !a.button.hidden);

  const bottomActions = actionBtns.filter(a => a.position !== "top-right")
  const topRightActions = actionBtns.filter(a => a.position === "top-right")

  const handleClose = () => {
    navigate(generatePageLink(mainPage, routeParams));
  };

  return <>
      <PlayStandardPage page={mainPage.name} />
      <Dialog open={true} fullWidth={true} maxWidth={'lg'} onClose={handleClose} sx={{"& .MuiDialog-paper": {minHeight: "50%"}}}>
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
          <PlayStandardPage page={page.name} mode="dialog" />
        </DialogContent>
        {bottomActions.length > 0 && <BottomActions sx={{padding: theme.spacing(3)}} actions={bottomActions} uiOptions={{}} defaultService={defaultService} jexlCtx={jexlCtx} />}
      </Dialog>
    </>
};

export default PlayDialogPage;
