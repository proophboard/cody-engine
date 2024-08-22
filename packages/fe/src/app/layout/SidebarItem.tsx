import * as React from 'react';
import {Box, Button, ListItem, Theme} from "@mui/material";
import {User} from "@app/shared/types/core/user/user";
import {DynamicSidebar} from "@frontend/app/pages/page-definitions";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {NavLink} from "react-router-dom";
import SidebarSubMenu from "@frontend/app/layout/SidebarSubMenu";
import {makeButtonSx, makeIconBoxSx, makeListItemSx} from "@frontend/app/layout/Sidebar";
import {useContext, useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {configStore} from "@cody-play/state/config-store";
import {makeLocalApiQuery} from "@cody-play/queries/local-api-query";
import {useUser} from "@frontend/hooks/use-user";
import {
  isQueryableDescription,
  isQueryableListDescription,
  isQueryableValueObjectDescription, QueryableDescription
} from "@event-engine/descriptions/descriptions";
import {usePageData} from "@frontend/hooks/use-page-data";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";

interface OwnProps {
  route: string,
  label: string,
  service: string,
  Icon: JSX.Element,
  theme: Theme,
  user: User,
  pageMatch: {pathname: string},
  invisible?: string | boolean,
  dynamic?: DynamicSidebar
}

type SidebarItemProps = OwnProps;

const SidebarItem = ({invisible, route, label, Icon, theme, user, pageMatch, service, dynamic}: SidebarItemProps) => {
  const [hidden, setHidden] = useState(false);
  const [dynamicLabel, setDynamicLabel] = useState<string | undefined>('');
  const [DynamicIcon, setDynamicIcon] = useState<JSX.Element | undefined>();
  const {config} = useContext(configStore);
  const [page] = usePageData();

  useEffect(() => {
    if(dynamic) {
      try {
        const voInfo = playGetVoRuntimeInfoFromDataReference(dynamic.data, service, config.types);

        const desc = voInfo.desc;

        if(!isQueryableDescription(desc)) {
          setDynamicLabel('Failed! Data is not queryable');
          return;
        }

        makeLocalApiQuery(config, user)((desc as QueryableDescription).query, {}).then(data => {
          if(dynamic.label) {
            const dLabel = jexl.evalSync(dynamic.label, {data, page, user});
            setDynamicLabel(dLabel);
          }

          if(dynamic.icon) {
            const dIcon = jexl.evalSync(dynamic.icon, {data, page, user});
            setDynamicIcon(<MdiIcon  icon={dIcon} />)
          }

          if(dynamic.hidden) {
            setHidden(jexl.evalSync(dynamic.hidden, {data, page, user}));
          }
        }).catch(e => {
          throw e
        });
      } catch (e) {
        console.error(e);
        setDynamicLabel('Failed! Data type is unknown');
        return;
      }
    }
  }, [dynamic, page, user]);

  if(typeof invisible === "boolean" && invisible) {
    return <></>
  }

  if(typeof invisible === "string" && jexl.evalSync(invisible, {user})) {
    return <></>
  }

  if(hidden) {
    return <></>
  }

  return <div key={route}><ListItem
    key={route}
    disableGutters={true}
    sx={makeListItemSx(theme)}
  >
    <Button
      sx={makeButtonSx(theme)}
      component={NavLink}
      to={route}
    >
      <Box component={"div"} sx={makeIconBoxSx(theme)}>
        {DynamicIcon || Icon}
      </Box>
      {dynamicLabel || label}
    </Button>
  </ListItem>
    {pageMatch.pathname.includes(route) && <SidebarSubMenu/>}
  </div>
};

export default SidebarItem;
