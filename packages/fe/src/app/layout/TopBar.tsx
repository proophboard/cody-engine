import React, {useContext} from 'react';
import {AppBar, Box, Toolbar, Typography, IconButton, useTheme, useMediaQuery, Avatar} from "@mui/material";
import Breadcrumbs from "@frontend/app/layout/Breadcrumbs";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {environment} from "@frontend/environments/environment";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import {useUser} from "@frontend/hooks/use-user";
import {getConfiguredKeycloak} from "@frontend/keycloak/get-configured-keycloak";
import {LogoutOutlined} from "@mui/icons-material";
import LanguageSwitch from "@frontend/app/components/core/LanguageSwitch";


interface OwnProps {
  sidebarOpen: boolean;
  onOpenSidebar: (openSidebar: boolean) => void;
}

type TopBarProps = OwnProps;

const TopBar = (props: TopBarProps) => {
  const theme = useTheme();
  const [currentUser] = useUser();
  const {mode, toggleColorMode} = useContext(ColorModeContext);
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  // @TODO: Remove flags when language switch and logout work for prototyping, too
  const showLanguageSwitch = environment.mode === 'production-stack';
  const showLogout = environment.mode === 'production-stack';

  return (
    <AppBar position="fixed" color="default" sx={{
      boxShadow: "none",
      backgroundColor: (theme) => theme.palette.primary.main,
      height: "64px"
    }}>
      <Toolbar>
        {!sideBarPersistent && environment.layout === 'task-based-ui' && <IconButton onClick={() => props.onOpenSidebar(!props.sidebarOpen)} sx={{color: theme.palette.primary.contrastText, marginRight: (theme) => theme.spacing(2)}}>
          {props.sidebarOpen? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>}
        <Box component={"div"} sx={{minWidth: {lg: "300px"}}}>
          <Typography variant={"h2"} sx={{color: (theme) => theme.palette.primary.contrastText, fontSize: sideBarPersistent ? "2rem" : "1.5rem"}}>{environment.appName}</Typography>
        </Box>
        {environment.layout === 'prototype' && <Breadcrumbs/>}
        <Box component={"div"} sx={{flexGrow: 1}}/>
        <IconButton aria-label="Light mode" onClick={toggleColorMode}>
          {mode === 'light' && <LightModeIcon sx={{ color: theme.palette.primary.contrastText }}/> }
          {mode === 'dark' && <DarkModeIcon sx={{ color: theme.palette.primary.contrastText }}/> }
        </IconButton>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing(1), marginLeft: theme.spacing(2) }}
        >
          {showLanguageSwitch && <LanguageSwitch color={theme.palette.primary.contrastText}/>}
          <Avatar sx={{ backgroundColor: 'primary.dark' }} title={currentUser.displayName}>
            {`${currentUser.displayName.split(' ')[0][0]}${
              currentUser.displayName.split(' ').length > 1
                ? currentUser.displayName.split(' ')[1][0]
                : ''
            }`}
          </Avatar>
        </Box>
        {showLogout && (
          <IconButton
            onClick={() => getConfiguredKeycloak().logout()}
            sx={{color: theme.palette.primary.contrastText, marginLeft: theme.spacing(2)}}
          >
            <LogoutOutlined />
          </IconButton>
        )}
        {!sideBarPersistent && environment.layout === 'prototype' && <IconButton onClick={() => props.onOpenSidebar(!props.sidebarOpen)} sx={{color: theme.palette.primary.contrastText}}>
          {props.sidebarOpen? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>}
      </Toolbar>
    </AppBar>
  )
};

export default TopBar;
