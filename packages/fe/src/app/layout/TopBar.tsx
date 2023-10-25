import React, {createContext, useContext} from 'react';
import {AppBar, Box, Toolbar, Typography, IconButton, useTheme, useMediaQuery} from "@mui/material";
import Breadcrumbs from "@frontend/app/layout/Breadcrumbs";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {environment} from "@frontend/environments/environment";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";


interface OwnProps {
  sidebarOpen: boolean;
  onOpenSidebar: (openSidebar: boolean) => void;
}

type TopBarProps = OwnProps;

const TopBar = (props: TopBarProps) => {
  const theme = useTheme();
  const {mode, toggleColorMode} = useContext(ColorModeContext);
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  return (
    <AppBar position="fixed" color="default" sx={{
      boxShadow: "none",
      backgroundColor: (theme) => theme.palette.primary.main,
      height: "64px"
    }}>
      <Toolbar>
        <Box component={"div"} sx={{minWidth: {lg: "300px"}}}>
          <Typography variant={"h3"} sx={{color: (theme) => theme.palette.primary.contrastText}}>{environment.appName}</Typography>
        </Box>
        <Breadcrumbs />
        <Box component={"div"} sx={{flexGrow: 1}}/>
        <IconButton aria-label="Light mode" onClick={toggleColorMode}>
          {mode === 'light' && <LightModeIcon sx={{ color: 'white' }}/> }
          {mode === 'dark' && <DarkModeIcon sx={{ color: 'black' }}/> }
        </IconButton>
        {!sideBarPersistent && <IconButton onClick={() => props.onOpenSidebar(!props.sidebarOpen)} sx={{color: mode === 'dark' ? 'black' : 'white'}}>
          {props.sidebarOpen? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>}
      </Toolbar>
    </AppBar>
  )
};

export default TopBar;
