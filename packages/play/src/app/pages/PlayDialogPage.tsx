import * as React from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {names} from "@event-engine/messaging/helpers";
import {getMainPage, getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {PageRegistry} from "@frontend/app/pages";
import {getCommandButtons, PlayStandardPage} from "@cody-play/app/pages/PlayStandardPage";
import {Dialog, DialogActions, DialogContent, DialogTitle, IconButton, useTheme} from "@mui/material";
import {Close} from "mdi-material-ui";
import {generatePageLink} from "@frontend/app/components/core/PageLink";

interface OwnProps {
  page: string;
}

type PlayDialogPageProps = OwnProps;

const PlayDialogPage = (props: PlayDialogPageProps) => {
  const theme = useTheme();
  const routeParams = useParams();
  const pageMatch = usePageMatch();
  const {config} = useContext(configStore);
  const {reset} = useContext(PageDataContext);
  const defaultService = names(config.appName).className;
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      reset();
    }
  }, []);

  const page = config.pages[props.page];
  const mainPage = getMainPage(page as unknown as PageDefinition, config.pages as unknown as PageRegistry, defaultService);

  const cmdBtns = getCommandButtons(page, config);

  const handleCancel = () => {
    navigate(generatePageLink(mainPage, routeParams));
  };

  return <>
      <PlayStandardPage page={mainPage.name} />
      <Dialog open={true} fullWidth={true} maxWidth={'lg'} onClose={handleCancel} sx={{"& .MuiDialog-paper": {minHeight: "50%"}}}>
        <DialogTitle>
          {getPageTitle(page as unknown as PageDefinition)}
          <IconButton sx={{
            position: 'absolute',
            right: theme.spacing(1),
            top: theme.spacing(0.5),
            color: theme.palette.grey[500],
          }} onClick={handleCancel}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PlayStandardPage page={page.name} mode="dialog" />
        </DialogContent>
        {cmdBtns.length && <DialogActions>
          {cmdBtns}
        </DialogActions>}
      </Dialog>
    </>
};

export default PlayDialogPage;
