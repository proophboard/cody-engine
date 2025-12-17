import * as React from 'react';
import {Box, Button, IconButton, ListItem, Theme} from "@mui/material";
import {User} from "@app/shared/types/core/user/user";
import {DynamicSidebar} from "@frontend/app/pages/page-definitions";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {NavLink} from "react-router-dom";
import {makeButtonSx, makeIconBoxSx, makeListItemSx} from "@frontend/app/layout/Sidebar";
import {useContext, useEffect, useState} from "react";
import {
  isQueryableDescription, QueryableDescription
} from "@event-engine/descriptions/descriptions";
import {usePageData} from "@frontend/hooks/use-page-data";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";
import {useTypes} from "@frontend/hooks/use-types";
import {PlayInformationRegistry} from "@cody-play/state/types";
import {getApiQuery} from "@frontend/queries/use-api-query";
import {LiveEditModeContext} from "@cody-play/app/layout/PlayToggleLiveEditMode";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {Target} from "mdi-material-ui";
import {FocusedSidebarItem} from "@cody-play/state/focused-element";
import {useGlobalStore} from "@frontend/hooks/use-global-store";

interface OwnProps {
  pageName: string,
  route: string,
  label: string,
  service: string,
  Icon: React.JSX.Element,
  theme: Theme,
  user: User,
  pageMatch: {pathname: string},
  invisible?: string | boolean,
  dynamic?: DynamicSidebar,
  isFirst?: boolean,
  isLast?: boolean
}

type SidebarItemProps = OwnProps;

const SidebarItem = ({pageName, invisible, route, label, Icon, theme, user, pageMatch, service, dynamic}: SidebarItemProps) => {
  const [hidden, setHidden] = useState(!!(dynamic && dynamic.hidden));
  const [dynamicLabel, setDynamicLabel] = useState<string | undefined>('');
  const [DynamicIcon, setDynamicIcon] = useState<React.JSX.Element | undefined>();
  const [page] = usePageData();
  const [store] = useGlobalStore();
  const [types] = useTypes();
  const { liveEditMode } = useContext(LiveEditModeContext);
  const [focusedEle, setFocusedEle] = useVibeCodyFocusElement();

  useEffect(() => {
    if(dynamic) {
      try {
        const voInfo = playGetVoRuntimeInfoFromDataReference(dynamic.data, service, types as unknown as PlayInformationRegistry);

        const desc = voInfo.desc;

        if(!isQueryableDescription(desc)) {
          setDynamicLabel('Failed! Data is not queryable');
          return;
        }

        if (dynamic.if) {
          const shouldExecute = jexl.evalSync(dynamic.if, {
            page,
            user,
            store,
          });

          if (!shouldExecute) {
            return;
          }
        }


        getApiQuery()((desc as QueryableDescription).query, {}).then(data => {
          if(dynamic.label) {
            const dLabel = jexl.evalSync(dynamic.label, {data, page, user, store});
            setDynamicLabel(dLabel);
          }

          if(dynamic.icon) {
            const dIcon = jexl.evalSync(dynamic.icon, {data, page, user, store});
            setDynamicIcon(<MdiIcon  icon={dIcon} />)
          }

          if(dynamic.hidden) {
            setHidden(jexl.evalSync(dynamic.hidden, {data, page, user, store}));
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

  if(typeof invisible === "string" && jexl.evalSync(invisible, {user, page, store})) {
    return <></>
  }

  if(hidden) {
    return <></>
  }

  const isFocusedEle = focusedEle && focusedEle.type === "sidebarItem" && focusedEle.id === route;

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
    {liveEditMode && <IconButton onClick={() => setFocusedEle({
      id: route,
      name: dynamicLabel || label,
      type: 'sidebarItem',
      pageName,
    } as FocusedSidebarItem)} color={isFocusedEle ? 'info' : undefined}><Target /></IconButton>}
  </ListItem>
    {/* Deactivated for now, the idea is to bring it back as an optional feature on a per page basis {pageMatch.pathname.includes(route) && <SidebarSubMenu/>}*/}
  </div>
};

export default SidebarItem;
