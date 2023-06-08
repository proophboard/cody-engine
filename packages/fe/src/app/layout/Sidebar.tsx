import * as React from 'react';
import {Box, Button, Drawer, List, ListItem, useMediaQuery, useTheme} from "@mui/material";
import {pages} from "@frontend/app/pages";
import {NavLink} from "react-router-dom";
import {isTopLevelPage, TopLevelPage} from "@frontend/app/pages/page-definitions";
import SidebarSubMenu from "@frontend/app/layout/SidebarSubMenu";
import {usePageMatch} from "@frontend/util/hook/use-page-match";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type SidebarProps = OwnProps;

const Sidebar = (props: SidebarProps) => {

  const theme = useTheme();
  const pageMatch = usePageMatch();
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const topLevelPages: TopLevelPage[] = Object.values(pages).filter(p => isTopLevelPage(p)) as TopLevelPage[];
  const topLevelPageItems = topLevelPages.map(({route, sidebar: {label, Icon}}) => <div key={route}><ListItem
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
        <Icon />
      </Box>
      {label}
    </Button>
  </ListItem>
  {pageMatch.pathname.includes(route) && <SidebarSubMenu />}
  </div>);

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
