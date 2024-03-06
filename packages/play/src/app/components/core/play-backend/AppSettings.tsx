import * as React from 'react';
import {Alert, Box, Button, DialogContent, FormLabel, TextField, useTheme} from "@mui/material";
import {useContext, useEffect, useState} from "react";
import {configStore} from "@cody-play/state/config-store";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {saveConfigToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-config-to-local-storage";
import Editor from "@monaco-editor/react";
import {ZipDisk} from "mdi-material-ui";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";

interface OwnProps {
  saveCallback: (cb: () => void) => void;
  onSaveDisabled: (disabled: boolean) => void;
}

type AppSettingsProps = OwnProps;

const AppSettings = (props: AppSettingsProps) => {
  const {config, dispatch} = useContext(configStore);
  const [appName, setAppName] = useState('');
  const [themeOptions, setThemeOptions] = useState(JSON.stringify({}, null, 2));
  const [invalidThemeOptions, setInvalidThemeOptions] = useState(false);
  const {setPendingChanges} = useContext(PendingChangesContext);

  useEffect(() => {
    setAppName(config.appName);
    setThemeOptions(JSON.stringify(config.theme, null, 2));
    props.onSaveDisabled(true);
  }, [config.appName, config.theme]);

  const handleNameChanged = (newName: string) => {
    setAppName(newName);
    props.onSaveDisabled(false);
  }

  const handleThemeChanged = (changedThemeOptions: string | undefined) => {
    if(!changedThemeOptions) {
      changedThemeOptions = '{}';
    }
    setThemeOptions(changedThemeOptions);
    props.onSaveDisabled(false);

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
      props.onSaveDisabled(true);
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
        setPendingChanges(true);
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
          setPendingChanges(true);
        }
      } catch (e) {
        setInvalidThemeOptions(true);
        return;
      } finally {
        props.onSaveDisabled(true);
      }
    }
  }

  props.saveCallback(handleSave);

  return <Box
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
      <Box sx={{display: 'flex'}}>
        <small>See <a href="https://mui.com/material-ui/customization/theming/#theme-configuration-variables"
                       target="material_ui">Material UI docs</a> for options</small>
      </Box>
    </div>
  </Box>
};

export default AppSettings;
