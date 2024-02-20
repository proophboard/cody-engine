import * as React from 'react';
import {Box, Drawer, List, useMediaQuery, useTheme} from "@mui/material";
import {
  belongsToGroup,
  isTopLevelPage,
  PageDefinition,
  TopLevelGroup,
  TopLevelPage
} from "@frontend/app/pages/page-definitions";
import {useUser} from "@frontend/hooks/use-user";
import {useContext} from "react";
import {configStore} from "@cody-play/state/config-store";
import {PlayTopLevelPage} from "@cody-play/state/types";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import {isVisibleInSidebar, makeSidebarItem, sortTopLevelPages} from "@frontend/app/layout/Sidebar";
import SidebarNavGroup from "@frontend/app/layout/SidebarNavGroup";
import {names} from "@event-engine/messaging/helpers";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type SidebarProps = OwnProps;
type Group = {config: TopLevelGroup, pages: PlayTopLevelPage[]};

const Sidebar = (props: SidebarProps) => {

  const {config} = useContext(configStore);
  const theme = useTheme();
  const pageMatch = usePlayPageMatch();
  const [user,] = useUser();
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const groups: Record<string, Group> = {};
  const topLevelPages: PlayTopLevelPage[] = Object.values(config.pages)
    .filter(p => isTopLevelPage(p as unknown as PageDefinition) && isVisibleInSidebar(p as unknown as TopLevelPage, user)) as PlayTopLevelPage[];

  const topLevelPagesWithoutGroups = topLevelPages.sort(sortTopLevelPages).filter(p => {
    const pGroup = belongsToGroup(p);

    if(!pGroup) {
      return true;
    }

    if(groups[pGroup.label]) {
      groups[pGroup.label].pages.push(p);
      if(pGroup.icon !== 'square') {
        groups[pGroup.label].config.icon = pGroup.icon;
      }
      return false;
    }

    groups[pGroup.label] = {config: pGroup, pages: [p]};
    // Keep first group page in list, so that we can insert group at the same index
    return true;
  });

  const topLevelPageItems = topLevelPagesWithoutGroups.map(({route, sidebar: {label, icon, invisible, group}}) => {
    const pGroup = belongsToGroup({sidebar: {group}})
    if(pGroup) {
      const cachedPGroup = groups[pGroup.label];
      return <SidebarNavGroup name={'group-' + names(cachedPGroup.config.label).fileName}
                              label={cachedPGroup.config.label}
                              Icon={<MdiIcon icon={cachedPGroup.config.icon} />}
                              pages={cachedPGroup.pages.map(p => makeSidebarItem(p.route, p.sidebar.label, <MdiIcon icon={p.sidebar.icon} />, theme, user, pageMatch, p.sidebar.invisible))}
      />
    }

    return makeSidebarItem(route, label, <MdiIcon  icon={icon} />, theme, user, pageMatch, invisible)
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
