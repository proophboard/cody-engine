import * as React from 'react';
import {Box, DialogActions, DialogTitle, Drawer, IconButton, Toolbar, useTheme} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import {useContext, useEffect} from "react";
import {configStore} from "@cody-play/state/config-store";
import {PageDataContext} from "@frontend/app/providers/PageData";
import {names} from "@event-engine/messaging/helpers";
import {getMainPage, getPageTitle, PageDefinition} from "@frontend/app/pages/page-definitions";
import {PageRegistry} from "@frontend/app/pages";
import {getCommandButtons, PlayStandardPage} from "@cody-play/app/pages/PlayStandardPage";
import {generatePageLink} from "@frontend/app/components/core/PageLink";
import {Close} from "mdi-material-ui";

interface OwnProps {
  page: string;
}

type PlayRightDrawerPageProps = OwnProps;

const drawerWidth = 500;


const PlayRightDrawerPage = (props: PlayRightDrawerPageProps) => {
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

  const handleClose = () => {
    navigate(generatePageLink(mainPage, routeParams));
  };

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
      <DialogTitle sx={{paddingBottom: "29px"}}>
        {getPageTitle(page as unknown as PageDefinition)}
        <IconButton sx={{
          position: 'absolute',
          right: theme.spacing(1),
          top: parseInt(theme.spacing(2)) + 64 + 'px',
          color: theme.palette.grey[500],
        }} onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <PlayStandardPage page={page.name} mode="dialog" />
      {cmdBtns.length && <DialogActions sx={{marginTop: theme.spacing(2)}}>
        {cmdBtns}
      </DialogActions>}
    </Drawer>
  </>
};

export default PlayRightDrawerPage;
