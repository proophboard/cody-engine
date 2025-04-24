import * as React from 'react';
import {
  Alert, AlertTitle,
  Box,
  FormLabel,
  IconButton,
  MenuItem,
  TextField, ThemeOptions,
  useTheme
} from "@mui/material";
import {useContext, useEffect, useState} from "react";
import {configStore, LayoutType} from "@cody-play/state/config-store";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {saveConfigToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-config-to-local-storage";
import Editor from "@monaco-editor/react";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import Grid2 from "@mui/material/Unstable_Grid2";
import {jsonrepair} from "jsonrepair";
import {JexlFlavouredJSON} from "@event-engine/infrastructure/code-editor/JexlFlavouredJSON";
import {merge} from "lodash/fp";
import {createTheme} from "@frontend/app/layout/theme";

interface OwnProps {
  saveCallback: (cb: () => void) => void;
  onSaveDisabled: (disabled: boolean) => void;
}

type AppSettingsProps = OwnProps;

const AppSettings = (props: AppSettingsProps) => {
  const theme = useTheme();
  const {config, dispatch} = useContext(configStore);
  const [appName, setAppName] = useState('');
  const [defaultService, setDefaultService] = useState('');
  const [layout, setLayout] = useState<LayoutType>('prototype');
  const [themeOptions, setThemeOptions] = useState(JSON.stringify({}, null, 2));
  const [invalidThemeOptions, setInvalidThemeOptions] = useState(false);
  const [invalidThemeOptionsError, setInvalidThemeOptionsError] = useState<string|undefined>();
  const [themeEditorHeight, setThemeEditorHeight] = useState(200);
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');
  const {setPendingChanges} = useContext(PendingChangesContext);

  const monaco = (window as any).monaco;

  useEffect(() => {
    setAppName(config.appName);
    setDefaultService(config.defaultService);
    setLayout(config.layout);
    setThemeOptions(JSON.stringify(config.theme, null, 2));
    props.onSaveDisabled(true);
  }, [config.appName, config.defaultService, config.layout, config.theme]);

  useEffect(() => {
    window.setTimeout(() => {
      setEditorTheme(theme.palette.mode === 'dark' ? 'vs-dark' : 'vs');
    },10);
  }, [theme.palette.mode]);

  useEffect(() => {
    if(monaco) {
      ((globalMonaco: any) => {
        globalMonaco.languages.setMonarchTokensProvider('json', JexlFlavouredJSON);
      })(monaco);
    }
  }, [monaco]);

  const handleNameChanged = (newName: string) => {
    setAppName(newName);
    props.onSaveDisabled(false);
  }

  const handleDefaultServiceChanged = (newDefaultService: string) => {
    setDefaultService(newDefaultService);
    props.onSaveDisabled(false);
  }

  const handleLayoutChanged = (newLayout: LayoutType) => {
    setLayout(newLayout);
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


  const validateTheme = (themeOptionsStr: string): ThemeOptions | false => {
    try {
      const options = JSON.parse(jsonrepair(themeOptionsStr));

      // Test both color modes
      const lightOptions = merge(options, {palette: {mode: 'light'}});
      const darkOptions = merge(options, {palette: {mode: 'dark'}});

      createTheme(lightOptions);
      createTheme(darkOptions);

      setInvalidThemeOptions(false);
      setInvalidThemeOptionsError(undefined);

      return options;
    } catch (e) {
      setInvalidThemeOptions(true);
      setInvalidThemeOptionsError((e as any).toString());
      console.error(e);
      props.onSaveDisabled(true);
    }

    return false;
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

    if(defaultService !== config.defaultService) {
      dispatch({
        type: "RENAME_DEFAULT_SERVICE",
        name: defaultService
      })

      if(boardId) {
        saveConfigToLocalStorage({...config, defaultService}, boardId);
        setPendingChanges(true);
      }
    }

    if(layout !== config.layout) {
      dispatch({
        type: "CHANGE_LAYOUT",
        layout
      })

      if(boardId) {
        saveConfigToLocalStorage({...config, layout}, boardId);
        setPendingChanges(true);
      }
    }

    if(themeOptions !== JSON.stringify(config.theme)) {
      try {
        let updatedTheme = validateTheme(themeOptions);

        if(!updatedTheme) {
          return;
        }

        dispatch({
          type: "CHANGE_THEME",
          theme: updatedTheme
        })

        if(boardId) {
          saveConfigToLocalStorage({...config, appName, defaultService, layout, theme: updatedTheme}, boardId);
          setPendingChanges(true);
        }
      } catch (e) {
        setInvalidThemeOptions(true);
        setInvalidThemeOptionsError((e as any).toString());
        console.error(e);
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
        fullWidth={true}
      />
    </div>
    <div>
      <TextField
        id="default-service"
        label="Default Service"
        defaultValue="App"
        variant="standard"
        value={defaultService}
        onChange={(e: any) => handleDefaultServiceChanged(e.target.value)}
        fullWidth={true}
      />
    </div>
    <div>
      <TextField
        id="layout"
        label="Layout"
        defaultValue="prototype"
        variant="standard"
        value={layout}
        select={true}
        onChange={(e: any) => handleLayoutChanged(e.target.value)}
        fullWidth={true}
      >
        <MenuItem value="prototype" key="prototype">Prototype</MenuItem>
        <MenuItem value="task-based-ui" key="task-based-ui">Task-Based UI</MenuItem>
      </TextField>
    </div>
    <Grid2 container style={{marginTop: "30px", marginLeft: "10px", marginRight: "10px", display: "flex"}}>
      <Grid2 xs={12}>
        <FormLabel>Theme</FormLabel>
        <IconButton sx={{marginLeft: "auto"}} title={'Click to expand editor. Ctrl+Click to double expand.'} color={themeEditorHeight > 200 ? 'primary' : 'default'} onClick={e => {
          const isExpanded = themeEditorHeight === 400;
          const isDoubleExpanded = themeEditorHeight === 800;

          let newHeight = 200;

          if(e.ctrlKey) {
            newHeight = isDoubleExpanded ? 400 : 800;
          } else {
            newHeight = isExpanded || isDoubleExpanded ? 200 : 400;
          }

          setThemeEditorHeight(newHeight);
        }} className={themeEditorHeight > 200 ? 'active' : ''}><MdiIcon icon="focus-field-horizontal" /></IconButton>
      </Grid2>
      <Grid2 xs={12}>
      {invalidThemeOptions &&
        <Alert variant="standard" severity="error">
          <AlertTitle>Invalid theme options. Please check your input!</AlertTitle>
          {invalidThemeOptionsError}
        </Alert>}
        <div style={{border: '1px solid #eee'}}>
          <Editor height={themeEditorHeight + 'px'}
                  language="json"
                  value={themeOptions}
                  onChange={handleThemeChanged}
                  onMount={(editor, monaco) => monaco.editor.setTheme(editorTheme)}
                  options={{
                    theme: editorTheme,
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
                    mouseWheelZoom: true,
                    fixedOverflowWidgets: true,
                    scrollbar: {
                      alwaysConsumeMouseWheel: false
                    }
                  }}
          />
        </div>
      </Grid2>
      <Grid2 xs={12}>
        <Box sx={{display: 'flex'}}>
          <small>See <a href="https://mui.com/material-ui/customization/theming/#theme-configuration-variables"
                        target="material_ui">Material UI docs</a> for options</small>
        </Box>
      </Grid2>
    </Grid2>
  </Box>
};

export default AppSettings;
