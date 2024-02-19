import * as React from 'react';
import {PropsWithChildren, useEffect, useState} from "react";
import {Button, Card, CardActions, CardHeader, Divider, SxProps, Theme, useTheme} from "@mui/material";
import {User} from "@app/shared/types/core/user/user";
import {PageData} from "@app/shared/types/core/page-data/page-data";
import jexl from "@app/shared/jexl/get-configured-jexl";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {NavLink} from "react-router-dom";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {makeButtonSx} from "@frontend/app/layout/Sidebar";
import {Tab} from "@frontend/app/pages/page-definitions";



interface OwnProps {
  tabs?: Tab[];
}

type CommandBarProps = OwnProps & PropsWithChildren;

type TabConfig = {
  disabled: boolean,
  style: SxProps,
  hidden: boolean
};

const determineTabConfig = (tab: Tab, user: User, page: PageData): TabConfig => {
  const jexlCtx = {user, page};

  const config = {
    style: tab.style || {},
    disabled: tab.disabled || 'false',
    hidden: tab.hidden || 'false'
  };


  if(tab.styleExpr) {
    config.style = jexl.evalSync(tab.styleExpr, jexlCtx);
  }

  return {
    style: config.style,
    disabled: jexl.evalSync(config.disabled, jexlCtx),
    hidden: jexl.evalSync(config.hidden, jexlCtx),
  }
}

const renderTabs = (tabs: Tab[], user: User, page: PageData, theme: Theme) => {
  const tabComponents = tabs.map(tab => {
    const config = determineTabConfig(tab, user, page);
    return <Button
      sx={{...makeButtonSx(theme), width: 'auto', minWidth: '150px', justifyContent: 'center', ...config.style} as SxProps}
      disabled={config.disabled}
      hidden={config.hidden}
      startIcon={tab.icon? <MdiIcon icon={tab.icon} /> : undefined}
      children={tab.label}
      key={tab.route}
      component={NavLink}
      to={tab.route}
    />
  })

  return <>{tabComponents}</>
}

const CommandBar = (props: CommandBarProps) => {
  const [fixed, setFixed] = useState<boolean>(false);
  const [user,] = useUser();
  const [pageData,] = usePageData();
  const theme = useTheme();
  const hasCommands = Array.isArray(props.children) && props.children.length;

  useEffect(() => {
    const listener = () => {
      const scrollTop = window.scrollY;

      if(scrollTop >= 80 && hasCommands) {
        setFixed(true);
      } else {
        setFixed(false);
      }
    }

    window.addEventListener('scroll', listener);

    listener();

    return () => {
      window.removeEventListener('scroll', listener);
    }
  });

  const cardActions = <CardActions sx={{
    overflow: "auto",
    whiteSpace: "nowrap",
    '& button': {
      minWidth: "160px"
    }
  }}>
    {props.children}
  </CardActions>;

  return <>
    <Card sx={fixed ? {
      position: 'fixed',
      zIndex: 1000,
      top: '60px',
      width: 'auto',
      right: '20px',
      [theme.breakpoints.down('lg')]: {
        left: '20px'
      },
      [theme.breakpoints.up('lg')]: {
        left: '320px'
      }
    } : {
      width: 'auto',
    }}>
      {!fixed && (props.tabs ? renderTabs(props.tabs, user, pageData, theme) : <CardHeader title="Actions"/>)}
      {!fixed && <Divider/>}
      {cardActions}
    </Card>
    {fixed && /* Mirror card to keep same space in the DOM */ <Card>
      {props.tabs? renderTabs(props.tabs, user, pageData, theme) : <CardHeader title="Actions"/>}
      <Divider/>
      {cardActions}
    </Card>}
  </>
};

export default CommandBar;
