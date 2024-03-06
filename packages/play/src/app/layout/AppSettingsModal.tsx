import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle, FormLabel,
  IconButton, Tab, Tabs,
  TextField,
  useTheme
} from "@mui/material";
import {Close, Database as DatabaseIcon, ZipDisk} from "mdi-material-ui";
import {useContext, useEffect, useRef, useState} from "react";
import {configStore} from "@cody-play/state/config-store";
import {saveConfigToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-config-to-local-storage";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import Editor from '@monaco-editor/react';
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {
  saveDataToLocalStorage,
  saveToLocalStorage
} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import AppSettings from "@cody-play/app/components/core/play-backend/AppSettings";
import {BuildCircleOutlined, PaletteOutlined} from "@mui/icons-material";
import PlayConfig from "@cody-play/app/components/core/play-backend/PlayConfig";
import Database from "@cody-play/app/components/core/play-backend/Database";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type AppSettingsModalProps = OwnProps;

let currentSaveHandler = () => { /* noop */ }

const AppSettingsModal = (props: AppSettingsModalProps) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [saveDisabled, setSavedDisabled] = useState(true);

  const handleClose = () => {
    props.onClose();
  }

  const handleSave = () => {
    currentSaveHandler();
  }

  return <Dialog open={props.open} fullWidth={true} maxWidth={'lg'} onClose={props.onClose} scroll={"paper"} sx={{"& .MuiDialog-paper": {height: "85%"}}}>
    <DialogTitle>
      Play Backend
      <IconButton sx={{
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(0.5),
        color: theme.palette.grey[500],
      }} onClick={props.onClose}>
        <Close />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{padding: '24px 24px'}}>
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{marginBottom: "50px"}}>
        <Tab icon={<DatabaseIcon />} label="Database" iconPosition="start" />
        <Tab icon={<BuildCircleOutlined />} label="Play Config" iconPosition="start" />
        <Tab icon={<PaletteOutlined />} label="Appearance" iconPosition="start" />
      </Tabs>
      {activeTab === 0 && <Database saveCallback={(saveCb) => currentSaveHandler = saveCb } onSaveDisabled={disabled => setSavedDisabled(disabled)} />}
      {activeTab === 1 && <PlayConfig saveCallback={(saveCb) => currentSaveHandler = saveCb } onSaveDisabled={disabled => setSavedDisabled(disabled)} />}
      {activeTab === 2 && <AppSettings saveCallback={(saveCb) => currentSaveHandler = saveCb } onSaveDisabled={disabled => setSavedDisabled(disabled)} />}
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
  </Dialog>
};

export default AppSettingsModal;
