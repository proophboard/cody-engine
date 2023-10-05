import * as React from 'react';
import {Box, Button, Drawer, List, ListItem, useMediaQuery, useTheme} from "@mui/material";
import {NavLink} from "react-router-dom";
import {isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useUser} from "@frontend/hooks/use-user";
import {useContext} from "react";
import {configStore} from "@cody-play/state/config-store";
import {PlayTopLevelPage} from "@cody-play/state/types";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import PlaySidebarSubMenu from "@cody-play/app/layout/PlaySidebarSubMenu";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type SidebarProps = OwnProps;

const Sidebar = (props: SidebarProps) => {

  const {config} = useContext(configStore);
  const theme = useTheme();
  const pageMatch = usePlayPageMatch();
  const [user,] = useUser();
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const topLevelPages: PlayTopLevelPage[] = Object.values(config.pages).filter(p => isTopLevelPage(p as unknown as PageDefinition)) as PlayTopLevelPage[];
  const topLevelPageItems = topLevelPages.map(({route, sidebar: {label, icon, invisible}}) => {
    if(typeof invisible === "boolean" && invisible) {
      return <></>
    }

    if(typeof invisible === "string" && jexl.evalSync(invisible, {user})) {
      return <></>
    }

    return <div key={route}><ListItem
      key={route}
      disableGutters={true}
      sx={{
        display: 'flex',
        paddingTop: 0,
        paddingBottom: 0,
      }}
    >
      <Button
        sx={{
          color: 'inherit',
          padding: '10px 8px',
          justifyContent: 'flex-start',
          textTransform: 'none',
          letterSpacing: 0,
          width: '100%',
          fontWeight: theme.typography.fontWeightMedium,
          "&.active": {
            color: theme.palette.primary.main,
            fontWeight: theme.typography.fontWeightMedium,
          }
        }}
        component={NavLink}
        to={route}
      >
        <Box component={"div"} sx={{
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          marginRight: theme.spacing(1),
        }}>
          <MdiIcon  icon={icon} />
        </Box>
        {label}
      </Button>
    </ListItem>
      {pageMatch.pathname.includes(route) && <PlaySidebarSubMenu/>}
    </div>
  });

  return <Drawer
    open={props.open || sideBarPersistent}
    onClose={props.onClose}
    sx={{
      [`& .MuiDrawer-paper`]: {
        width: "300px",
        marginTop: "64px",
        [theme.breakpoints.up('lg')]: {
          marginTop: "64px",
          height: 'calc(100% - 64px)',
        },
      }
    }}
    variant={sideBarPersistent ? 'persistent' : 'temporary'}
    children={<Box component={"div"} sx={{
      backgroundColor: theme.palette.background.paper,
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100% - 32px)',
      padding: theme.spacing(2),
    }}>
      <List disablePadding={true} sx={{
        width: '100%',
        flex: 1,
      }}>
        {topLevelPageItems}
      </List>
    </Box>}
    />
};

export default Sidebar;
