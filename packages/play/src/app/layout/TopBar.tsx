import React, {useContext, useState} from 'react';
import {AppBar, Box, Toolbar, Typography, IconButton} from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {environment} from "@cody-play/environments/environment";
import PlayBreadcrumbs from "@cody-play/app/layout/PlayBreadcrumbs";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import AppSettingsModal from "@cody-play/app/layout/AppSettingsModal";
import {configStore} from "@cody-play/state/config-store";


interface OwnProps {

}

type TopBarProps = OwnProps;

const TopBar = (props: TopBarProps) => {
  const {config} = useContext(configStore);
  const {mode, toggleColorMode} = useContext(ColorModeContext);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openSettingsModal = () => {
    setSettingsOpen(true);
  }

  return (
    <AppBar position="fixed" color="default" sx={{
      boxShadow: "none",
      backgroundColor: (theme) => theme.palette.primary.main,
      height: "64px"
    }}>
      <Toolbar>
        <Box component={"div"} sx={{minWidth: {lg: "300px"}}}>
          <Typography variant={"h3"} sx={{color: (theme) => theme.palette.primary.contrastText}}>{config.appName}</Typography>
        </Box>
        <PlayBreadcrumbs />
        <Box component={"div"} sx={{flexGrow: 1}}/>
        <IconButton aria-label="Light mode" onClick={toggleColorMode}>
          {mode === 'light' && <LightModeIcon sx={{ color: 'white' }}/> }
          {mode === 'dark' && <DarkModeIcon sx={{ color: 'black' }}/> }
        </IconButton>
        <IconButton aria-label="App Settings" onClick={openSettingsModal} sx={{color: mode === 'dark' ? 'black' : 'white'}}>
          <SettingsSuggestIcon />
        </IconButton>
      </Toolbar>
      <AppSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppBar>
  )
};

export default TopBar;
