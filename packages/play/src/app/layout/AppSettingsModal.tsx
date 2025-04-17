import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle, Drawer, FormLabel,
  IconButton, Tab, Tabs,
  TextField,
  useTheme
} from "@mui/material";
import {Close, Database as DatabaseIcon, DockLeft, DockRight, SendCircleOutline, ZipDisk} from "mdi-material-ui";
import {useContext, useEffect, useRef, useState} from "react";
import AppSettings from "@cody-play/app/components/core/play-backend/AppSettings";
import {BuildCircleOutlined, PaletteOutlined} from "@mui/icons-material";
import PlayConfig from "@cody-play/app/components/core/play-backend/PlayConfig";
import Database from "@cody-play/app/components/core/play-backend/Database";
import Messagebox from "@cody-play/app/components/core/play-backend/Messagebox";
import Grid2 from "@mui/material/Unstable_Grid2";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import {config} from "@swc/core/spack";
import {configStore} from "@cody-play/state/config-store";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type AppSettingsModalProps = OwnProps;

let currentSaveHandler = () => { /* noop */ }

const drawerWidth = 540;

export type DockMode = 'left' | 'right' | 'dialog';

export const isDrawerMode = (mode: DockMode): mode is 'left' | 'right' => {
  return mode === 'left' || mode === 'right';
}

const AppSettingsModal = (props: AppSettingsModalProps) => {
  const theme = useTheme();
  const {config} = useContext(configStore);
  const [activeTab, setActiveTab] = useState(0);
  const [saveDisabled, setSavedDisabled] = useState(true);
  const [dockMode, setDockMode] = useState<DockMode>('dialog');

  const handleClose = () => {
    props.onClose();
  }

  const handleSave = () => {
    currentSaveHandler();
  }

  const settings = <>
    <DialogTitle>
      <Grid2 container>
        <Grid2 xs sx={{padding: theme.spacing(2)}}>
          Play Backend
        </Grid2>
        <TopRightActions  uiOptions={{}} defaultService={config.defaultService} jexlCtx={{} as any} additionalRightButtons={[
          <IconButton key={'app_settings_dock_right_btn'} title={'Dock right. Ctrl+Click to dock left.'} sx={{
            color: isDrawerMode(dockMode) ? theme.palette.primary.main : theme.palette.grey[500],
            marginLeft: 'auto'
          }} onClick={(e) => e.ctrlKey ? setDockMode(dockMode === 'left' ? 'right' : 'left') : setDockMode(isDrawerMode(dockMode) ? 'dialog' : 'right') }>
            {dockMode === 'left' ? <DockLeft/> : <DockRight/>}
          </IconButton>,
          <IconButton key={'app_settings_close_btn'} sx={{
            color: theme.palette.grey[500],
          }} onClick={props.onClose}>
            <Close />
          </IconButton>
        ]} />
      </Grid2>
    </DialogTitle>
    <DialogContent sx={{padding: '24px 24px'}}>
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{marginBottom: "30px"}}>
        <Tab icon={<DatabaseIcon />} label="Database" iconPosition={isDrawerMode(dockMode) ? "bottom" : "start"} />
        <Tab icon={<BuildCircleOutlined />} label="Play Config" iconPosition={isDrawerMode(dockMode) ? "bottom" : "start"} />
        <Tab icon={<PaletteOutlined />} label="Appearance" iconPosition={isDrawerMode(dockMode) ? "bottom" : "start"} />
        <Tab icon={<SendCircleOutline />} label="Messagebox" iconPosition={isDrawerMode(dockMode) ? "bottom" : "start"} />
      </Tabs>
      {activeTab === 0 && <Database saveCallback={(saveCb) => currentSaveHandler = saveCb } onSaveDisabled={disabled => setSavedDisabled(disabled)} />}
      {activeTab === 1 && <PlayConfig saveCallback={(saveCb) => currentSaveHandler = saveCb } onSaveDisabled={disabled => setSavedDisabled(disabled)} />}
      {activeTab === 2 && <AppSettings saveCallback={(saveCb) => currentSaveHandler = saveCb } onSaveDisabled={disabled => setSavedDisabled(disabled)} />}
      {activeTab === 3 && <Messagebox dockMode={dockMode} saveCallback={(saveCb) => currentSaveHandler = saveCb } onSaveDisabled={disabled => setSavedDisabled(disabled)} />}
    </DialogContent>
    <DialogActions>
      <Button
        variant={'contained'}
        color={'primary'}
        startIcon={ <ZipDisk />}
        sx={{ textTransform: 'none', marginTop: '10px', marginLeft: 'auto' }}
        onClick={handleSave}
        disabled={saveDisabled}
      >
        Save
      </Button>
    </DialogActions>
  </>

  if(isDrawerMode(dockMode)) {
    return <Drawer anchor={dockMode}
            open={props.open}
            onClose={props.onClose}
            variant="persistent"
            sx={{
              width: drawerWidth,
              overscrollBehavior: 'contain',
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', overflowX: "hidden" },
            }}
    >
      {settings}
    </Drawer>
  }

  return <Dialog open={props.open} fullWidth={true} maxWidth={'lg'} onClose={props.onClose} scroll={"paper"} sx={{"& .MuiDialog-paper": {height: "85%"}}}>
    {settings}
  </Dialog>
};

export default AppSettingsModal;
