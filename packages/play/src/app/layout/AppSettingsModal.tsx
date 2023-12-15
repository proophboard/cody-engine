import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog, DialogActions,
  DialogContent,
  DialogTitle, FormLabel,
  IconButton,
  TextField,
  useTheme
} from "@mui/material";
import {Close, Database, ZipDisk} from "mdi-material-ui";
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

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();

type AppSettingsModalProps = OwnProps;

const AppSettingsModal = (props: AppSettingsModalProps) => {
  const theme = useTheme();
  const {config, dispatch} = useContext(configStore);
  const [appName, setAppName] = useState('');
  const [themeOptions, setThemeOptions] = useState(JSON.stringify({}, null, 2));
  const [invalidThemeOptions, setInvalidThemeOptions] = useState(false);
  const [resetData, setResetData] = useState(false);

  useEffect(() => {
    setAppName(config.appName);
    setThemeOptions(JSON.stringify(config.theme, null, 2));
  }, [config.appName, config.theme]);

  const handleNameChanged = (newName: string) => {
    setAppName(newName);
  }

  const handleThemeChanged = (changedThemeOptions: string | undefined) => {
    if(!changedThemeOptions) {
      changedThemeOptions = '{}';
    }
    setThemeOptions(changedThemeOptions);

    if(invalidThemeOptions) {
      validateTheme(changedThemeOptions);
    }
  }


  const validateTheme = (themeOptionsStr: string) => {
    try {
      JSON.parse(themeOptionsStr);
      setInvalidThemeOptions(false);
    } catch (e) {
      setInvalidThemeOptions(true);
    }
  }

  const handleClose = () => {
    if(!resetData) {
      props.onClose();
    } else {
      setResetData(false);
    }
  }

  const handleSave = () => {
    const boardId = currentBoardId();


    if(appName !== config.appName) {
      dispatch({
        type: "RENAME_APP",
        name: appName,
      })

      if(boardId) {
        saveConfigToLocalStorage({...config, appName}, boardId);
      }
    }

    if(themeOptions !== JSON.stringify(config.theme)) {
      try {
        const updatedTheme = JSON.parse(themeOptions);

        dispatch({
          type: "CHANGE_THEME",
          theme: updatedTheme
        })

        if(boardId) {
          saveConfigToLocalStorage({...config, appName, theme: updatedTheme}, boardId);
        }
      } catch (e) {
        setInvalidThemeOptions(true);
        return;
      }
    }

    if(resetData && boardId) {
      (async () => {
        await es.importStreams({});
        await ds.importDocuments({});
        await saveDataToLocalStorage(ds, es, boardId);
      })().catch(e => {throw e})

      setResetData(false);
    }

    props.onClose();
  }

  return <Dialog open={props.open} fullWidth={true} maxWidth={'lg'} onClose={props.onClose} sx={{"& .MuiDialog-paper": {minHeight: "50%"}}}>
    <DialogTitle>
      App Settings
      <IconButton sx={{
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(0.5),
        color: theme.palette.grey[500],
      }} onClick={props.onClose}>
        <Close />
      </IconButton>
    </DialogTitle>
    {resetData && <DialogContent sx={{padding: '24px 24px'}} >
        <Alert severity={'warning'}>
            You're going to empty the Cody Play database for the current app. Play configuration will be kept, but all data is reset. Do you really want to do it?
        </Alert>
    </DialogContent>}
    {!resetData && <DialogContent sx={{padding: '24px 24px'}}>
      <Box
        component="form"
        sx={{
          '& .MuiTextField-root': {m: "10px"},
        }}
        noValidate
        autoComplete="off"
      >
        <div>
          <TextField
            id="app-name"
            label="App Name"
            defaultValue="Cody Play"
            variant="standard"
            value={appName}
            onChange={(e: any) => handleNameChanged(e.target.value)}
          />
        </div>
        <div style={{marginTop: "30px", marginLeft: "10px", marginRight: "10px"}}>
          <FormLabel>Theme</FormLabel>
          {invalidThemeOptions &&
              <Alert variant="standard" severity="error">Invalid theme options. Please check your input!</Alert>}
          <div style={{border: '1px solid #eee'}}>
            <Editor height="200px"
                    language="json"
                    value={themeOptions}
                    onChange={handleThemeChanged}
                    options={{
                      tabSize: 2,
                      folding: true,
                      glyphMargin: false,
                      lineDecorationsWidth: 1,
                      minimap: {
                        enabled: false
                      },
                      formatOnPaste: true,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      scrollbar: {
                        alwaysConsumeMouseWheel: false
                      }
                    }}
            />
          </div>
          <p><small>See <a href="https://mui.com/material-ui/customization/theming/#theme-configuration-variables"
                           target="material_ui">Material UI docs</a> for options</small></p>
        </div>
      </Box>
    </DialogContent>}
    <DialogActions>
      <Button
        children={'Reset Data'}
        startIcon={ <Database /> }
        color={'secondary'}
        title={'Empty the Cody Play database, but keep configuration in place'}
        disabled={resetData}
        onClick={() => setResetData(true)}
      />
      <Box sx={{flex: '1 0 0'}} />
      <Button
        children={resetData? 'No' : 'Close'}
        onClick={handleClose}
        color={'secondary'}
      />
      <Button
        variant={'contained'}
        color={'primary'}
        startIcon={ <ZipDisk />}
        sx={{ textTransform: 'none', margin: '5px' }}
        onClick={handleSave}
        disabled={appName === config.appName && JSON.stringify(config.theme, null, 2) === themeOptions && !resetData}
      >
        {resetData? 'Yes' : 'Save'}
      </Button>
    </DialogActions>
  </Dialog>
};

export default AppSettingsModal;
