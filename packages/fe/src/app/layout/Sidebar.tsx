import * as React from 'react';
import {Box, Button, Drawer, List, ListItem, SxProps, Theme, useMediaQuery, useTheme} from "@mui/material";
import {pages} from "@frontend/app/pages";
import {
  belongsToGroup,
  DynamicSidebar,
  isTopLevelPage,
  TopLevelGroup,
  TopLevelPage
} from "@frontend/app/pages/page-definitions";
import {usePageMatch} from "@frontend/util/hook/use-page-match";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {useUser} from "@frontend/hooks/use-user";
import {User} from "@app/shared/types/core/user/user";
import SidebarNavGroup from "@frontend/app/layout/SidebarNavGroup";
import {names} from "@event-engine/messaging/helpers";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import SidebarItem from "@frontend/app/layout/SidebarItem";
import {useTranslation} from "react-i18next";
import {ActionContainerInfo} from "@frontend/app/components/core/form/types/action";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type SidebarProps = OwnProps;

export const makeListItemSx = (theme: Theme): SxProps => {
  return {
    display: 'flex',
    paddingTop: 0,
    paddingBottom: 0,
  }
}

export const makeButtonSx = (theme: Theme): SxProps => {
  return {
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
  }
}

export const makeIconBoxSx = (theme: Theme): SxProps => {
  return {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    marginRight: theme.spacing(1),
  };
}

export const isVisibleInSidebar = (p: {sidebar?: {invisible?: boolean | string}}, user: User): boolean => {
  const invisible = p.sidebar?.invisible;

  if(typeof invisible === "boolean" && invisible) {
    return false;
  }

  if(typeof invisible === "string" && jexl.evalSync(invisible, {user})) {
    return false
  }

  return true;
}

export const sortTopLevelPages = (a: {sidebar: {position?: number}}, b: {sidebar: {position?: number}}) => {
  const aPos = typeof a.sidebar.position === "undefined" ? 5 : a.sidebar.position;
  const bPos = typeof b.sidebar.position === "undefined" ? 5 : b.sidebar.position;

  return aPos - bPos;
}

export const makeSidebarItem = (pageName: string, route: string, label: string, Icon: JSX.Element, theme: Theme, user: User, pageMatch: {pathname: string}, invisible?: string | boolean, service = '', dynamic?: DynamicSidebar) => {
  return <SidebarItem key={route}
                      pageName={pageName}
                      route={route}
                      label={label}
                      Icon={Icon}
                      theme={theme}
                      user={user}
                      pageMatch={pageMatch}
                      invisible={invisible}
                      service={service}
                      dynamic={dynamic}
  />
}

type Group = {config: TopLevelGroup, pages: TopLevelPage[]};

const Sidebar = (props: SidebarProps) => {

  const theme = useTheme();
  const {t} = useTranslation();
  const pageMatch = usePageMatch();
  const [user,] = useUser();
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const groups: Record<string, Group> = {};
  const topLevelPages: TopLevelPage[] = Object.values(pages).filter(p => isTopLevelPage(p) && isVisibleInSidebar(p, user)) as TopLevelPage[];

  topLevelPages.sort(sortTopLevelPages);

  const topLevelPagesWithoutGroups = topLevelPages.filter(p => {
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
  })

  const topLevelPageItems = topLevelPagesWithoutGroups.map(({name, route, service, sidebar}) => {
    const pGroup = belongsToGroup({sidebar})
    if(pGroup) {
      const cachedPGroup = groups[pGroup.label];
      return <SidebarNavGroup name={'group-' + names(cachedPGroup.config.label).fileName}
                              label={cachedPGroup.config['label:t'] ? t(cachedPGroup.config['label:t']) : cachedPGroup.config.label}
                              Icon={<MdiIcon icon={cachedPGroup.config.icon} />}
                              pageDefinitions={cachedPGroup.pages}
                              pages={cachedPGroup.pages.map(p => makeSidebarItem(
                                p.name,
                                p.route,
                                p.sidebar['label:t'] ? t(p.sidebar['label:t']) : p.sidebar.label,
                                <p.sidebar.Icon />,
                                theme,
                                user,
                                pageMatch,
                                p.sidebar.invisible,
                                service,
                                p.sidebar.dynamic
                              ))}
      />
    }

    return makeSidebarItem(name, route, sidebar['label:t'] ? t(sidebar['label:t']) : sidebar.label, <sidebar.Icon />, theme, user, pageMatch, sidebar.invisible, service, sidebar.dynamic)
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
