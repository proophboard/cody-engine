import * as React from 'react';
import {PropsWithChildren, useEffect, useState} from "react";
import {Box, Button, Card, CardActions, CardHeader, Divider, SxProps, Theme, useTheme} from "@mui/material";
import {User} from "@app/shared/types/core/user/user";
import {PageData} from "@app/shared/types/core/page-data/page-data";
import jexl from "@app/shared/jexl/get-configured-jexl";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {NavLink} from "react-router-dom";
import {useUser} from "@frontend/hooks/use-user";
import {usePageData} from "@frontend/hooks/use-page-data";
import {makeButtonSx} from "@frontend/app/layout/Sidebar";
import {Tab} from "@frontend/app/pages/page-definitions";
import {useTranslation} from "react-i18next";
import {TFunction} from "i18next";



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

export const renderTabs = (tabs: Tab[], user: User, page: PageData, theme: Theme, t: TFunction, taskBasedUiLayout?: boolean) => {
  const tabComponents = tabs.map(tab => {
    const config = determineTabConfig(tab, user, page);

    const style = taskBasedUiLayout ? {
      ...makeButtonSx(theme),
      ["&.active"]: {
        borderBottom: "2px solid " + theme.palette.primary.main,
        borderRadius: 0,
        color: theme.palette.primary.main
      },
      width: 'auto',
      justifyContent: 'center',
      ...config.style} as SxProps
      : {
        ...makeButtonSx(theme),
        width: 'auto',
        minWidth: '150px',
        justifyContent: 'center',
        ...config.style} as SxProps;

    return config.hidden ? <></> : <Button
      sx={style}
      disabled={config.disabled}
      startIcon={tab.icon? <MdiIcon icon={tab.icon} /> : undefined}
      children={tab['label:t'] ? t(tab['label:t']) : tab.label}
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
  const {t} = useTranslation();

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
  }, []);

  const cardActions = <Box sx={{
    padding: `${theme.spacing(1)} 0`,
    backgroundColor: theme.palette.background.default,
    overflow: "auto",
    whiteSpace: "nowrap",
    '& button': {
      minWidth: "160px"
    },
    '&:not(:first-of-type)': {
      marginLeft: theme.spacing(1)
    }
  }}>
    {props.children}
  </Box>;

  return <>
    <Box sx={fixed ? {
      position: 'fixed',
      zIndex: 1000,
      top: '60px',
      width: 'auto',
      right: theme.spacing(4),
      [theme.breakpoints.down('lg')]: {
        left: theme.spacing(4)
      },
      [theme.breakpoints.up('lg')]: {
        left: 300 + parseInt(theme.spacing(4)) + "px"
      }
    } : {
      width: 'auto',
    }}>
      {!fixed && (props.tabs ? renderTabs(props.tabs, user, pageData, theme, t) : <CardHeader title="Actions"/>)}
      {!fixed && <Divider/>}
      {cardActions}
    </Box>
    {fixed && /* Mirror card to keep same space in the DOM */ <Box>
      {props.tabs? renderTabs(props.tabs, user, pageData, theme, t) : <CardHeader title="Actions"/>}
      <Divider/>
      {cardActions}
    </Box>}
  </>
};

export default CommandBar;
