import React, {useContext} from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Button
} from "@mui/material";
import Breadcrumbs from "@frontend/app/layout/Breadcrumbs";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {environment} from "@frontend/environments/environment";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import {useUser} from "@frontend/hooks/use-user";
import {getConfiguredKeycloak} from "@frontend/keycloak/get-configured-keycloak";
import {KeyboardArrowDownOutlined, KeyboardArrowUpOutlined, LoginOutlined, LogoutOutlined} from "@mui/icons-material";
import LanguageSwitch from "@frontend/app/components/core/LanguageSwitch";
import {NavLink} from "react-router-dom";
import UserAvatar from "@frontend/app/components/core/UserAvatar";


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

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const roleDropdownOpen = anchorEl !== null;

  // @TODO: Remove flags when language switch and logout work for prototyping, too
  const showLanguageSwitch = environment.mode === 'production-stack';
  const showLogout = environment.mode === 'production-stack';

  const handleAvatarClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <AppBar position="fixed" color="default" sx={{
      boxShadow: "none",
      backgroundColor: (theme) => theme.palette.primary.main,
      height: "64px",
      zIndex: theme.zIndex.drawer + 1
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
          sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing(1), marginLeft: theme.spacing(1) }}
        >
          {showLanguageSwitch && <LanguageSwitch color={theme.palette.primary.contrastText}/>}
          {currentUser.displayName !== "Anyone" && <NavLink style={{textDecoration: "none"}} to="/welcome">
            <UserAvatar user={currentUser} />
          </NavLink>}
          {currentUser.displayName === "Anyone" && <NavLink aria-label="Login"
                                                            title="Login"
                                                            to={'/welcome'}
          >
            <IconButton>
              <LoginOutlined sx={{ color: theme.palette.primary.contrastText }} />
            </IconButton>
          </NavLink>}
        </Box>
        {showLogout && (
          <IconButton
            onClick={() => getConfiguredKeycloak().logout()}
            aria-label="logout"
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
