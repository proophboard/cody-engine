import React, {useContext, useState} from 'react';
import {AppBar, Box, Toolbar, Typography, IconButton, useMediaQuery, useTheme, Avatar} from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import PlayBreadcrumbs from "@cody-play/app/layout/PlayBreadcrumbs";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen"
import AppSettingsModal from "@cody-play/app/layout/AppSettingsModal";
import {configStore} from "@cody-play/state/config-store";
import SaveData from "@cody-play/app/components/core/SaveData";
import {useUser} from "@frontend/hooks/use-user";
import LanguageSwitch from "@frontend/app/components/core/LanguageSwitch";
import {NavLink} from "react-router-dom";
import {LoginOutlined} from "@mui/icons-material";
import UserAvatar from "@frontend/app/components/core/UserAvatar";
import {Wrench} from "mdi-material-ui";
import CodyGPTDrawer from "@cody-play/app/components/core/cody-gpt/CodyGPTDrawer";


interface OwnProps {
  sidebarOpen: boolean;
  onOpenSidebar: (openSidebar: boolean) => void;
}

type TopBarProps = OwnProps;

const TopBar = (props: TopBarProps) => {
  const {config} = useContext(configStore);
  const [currentUser] = useUser();
  const theme = useTheme();
  const {mode, toggleColorMode} = useContext(ColorModeContext);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [codyGPTOpen, setCodyGPTOpen] = useState(false);
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const openSettingsModal = () => {
    setSettingsOpen(true);
    setCodyGPTOpen(false);
  }

  const openCodyGPT = () => {
    setCodyGPTOpen(true);
    setSettingsOpen(false);
  }

  const showLanguageSwitch = false;

  return (
    <AppBar position="fixed" color="default" sx={{
      boxShadow: "none",
      backgroundColor: (theme) => theme.palette.primary.main,
      height: "64px",
      zIndex: theme.zIndex.drawer + 1
    }}>
      <Toolbar>
        {!sideBarPersistent && config.layout === 'task-based-ui' && <IconButton onClick={() => props.onOpenSidebar(!props.sidebarOpen)} sx={{color: theme.palette.primary.contrastText, marginRight: (theme) => theme.spacing(2)}}>
          {props.sidebarOpen? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>}
        <Box component={"div"} sx={{minWidth: {lg: "300px"}}}>
          <Typography variant={"h2"} sx={{color: (theme) => theme.palette.primary.contrastText, fontSize: sideBarPersistent ? "2rem" : "1.5rem"}}>{config.appName}</Typography>
        </Box>
        {config.layout === 'prototype' && <PlayBreadcrumbs/>}
        <Box component={"div"} sx={{flexGrow: 1}}/>
        <SaveData color={theme.palette.primary.contrastText} />
        <IconButton onClick={openCodyGPT}><Wrench sx={{ color: theme.palette.primary.contrastText }} /></IconButton>
        <IconButton aria-label="Light mode" onClick={toggleColorMode}>
          {mode === 'light' && <LightModeIcon sx={{ color: theme.palette.primary.contrastText }}/> }
          {mode === 'dark' && <DarkModeIcon sx={{ color: theme.palette.primary.contrastText }}/> }
        </IconButton>
        <IconButton aria-label="App Settings" onClick={openSettingsModal} sx={{color: theme.palette.primary.contrastText}}>
          <SettingsSuggestIcon />
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
        {!sideBarPersistent && config.layout === 'prototype' && <IconButton onClick={() => props.onOpenSidebar(!props.sidebarOpen)} sx={{color: theme.palette.primary.contrastText}}>
          {props.sidebarOpen? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>}
      </Toolbar>
      <AppSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CodyGPTDrawer open={codyGPTOpen} onClose={() => setCodyGPTOpen(false)} />
    </AppBar>
  )
};

export default TopBar;
