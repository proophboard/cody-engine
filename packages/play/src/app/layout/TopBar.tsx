import React, {useContext} from 'react';
import {AppBar, Box, Toolbar, Typography, IconButton} from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {environment} from "@cody-play/environments/environment";
import PlayBreadcrumbs from "@cody-play/app/layout/PlayBreadcrumbs";


interface OwnProps {

}

type TopBarProps = OwnProps;

const TopBar = (props: TopBarProps) => {
  const {mode, toggleColorMode} = useContext(ColorModeContext);

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
        <PlayBreadcrumbs />
        <Box component={"div"} sx={{flexGrow: 1}}/>
        <IconButton aria-label="Light mode" onClick={toggleColorMode}>
          {mode === 'light' && <LightModeIcon sx={{ color: 'white' }}/> }
          {mode === 'dark' && <DarkModeIcon sx={{ color: 'black' }}/> }
        </IconButton>
      </Toolbar>
    </AppBar>
  )
};

export default TopBar;
