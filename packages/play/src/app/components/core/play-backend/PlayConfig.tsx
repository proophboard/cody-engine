import * as React from 'react';
import {useContext, useEffect, useRef, useState} from "react";
import {CodyPlayConfig, configStore, getEditedContextFromConfig} from "@cody-play/state/config-store";
import Editor, {Monaco} from "@monaco-editor/react";
import {Alert, Box, FormControlLabel, FormLabel, Switch, useTheme} from "@mui/material";
import {editor} from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {saveConfigToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-config-to-local-storage";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";
import {JexlFlavouredJSON} from "@event-engine/infrastructure/code-editor/JexlFlavouredJSON";
import {Playshot} from "@cody-play/infrastructure/cody/cody-message-server";
import {isEmpty} from "lodash";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";

interface OwnProps {
  saveCallback: (cb: () => void) => void;
  onSaveDisabled: (disabled: boolean) => void;
}

type PlayConfigProps = OwnProps;

let diffView = false;

const PlayConfig = (props: PlayConfigProps) => {
  const theme = useTheme();
  const {config, dispatch, lastPlayshot} = useContext(configStore);
  const [appConfig, setAppConfig] = useState(JSON.stringify(config, null, 2));
  const [invalidConfig, setInvalidConfig] = useState(false);
  const {setPendingChanges} = useContext(PendingChangesContext);
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');
  const editor = useRef<IStandaloneCodeEditor>();

  useEffect(() => {
    setAppConfig(getAppConfigString(config, diffView, lastPlayshot));
    props.onSaveDisabled(true);
  }, [config]);

  useEffect(() => {
    window.setTimeout(() => {
      setEditorTheme(theme.palette.mode === 'dark' ? 'vs-dark' : 'vs');
    },10);
  }, [theme.palette.mode]);

  const validateConfig = (editorVal: string): CodyPlayConfig | undefined => {

    try {
      const newPlayConfig = JSON.parse(editorVal);
      setInvalidConfig(false);
      return newPlayConfig;
    } catch (e) {
      setInvalidConfig(true);
      props.onSaveDisabled(true);
    }
  }

  const handleConfigChanged = (editorVal: string | undefined) => {
    if(!editorVal) {
      editorVal = '{}';
    }

    setAppConfig(editorVal);
    props.onSaveDisabled(false);

    if(invalidConfig) {
      validateConfig(editorVal);
    }
  }

  const toggleDiffView = () => {
    diffView = !diffView;

    setAppConfig(getAppConfigString(config, diffView, lastPlayshot));

    window.setTimeout(() => {
      if(editor.current) {
        applyDefaultEditorFolding(editor.current);
      }
    }, 200);
  }

  const handleSave = () => {
    const newPlayConfig = validateConfig(appConfig);

    if(newPlayConfig) {
      const mergedConfig = mergeDiff(newPlayConfig, diffView, lastPlayshot);

      dispatch({
        type: "INIT",
        payload: mergedConfig,
        ctx: getEditedContextFromConfig(newPlayConfig)
      })

      const boardId = currentBoardId();

      if(boardId) {
        saveConfigToLocalStorage({...mergedConfig}, boardId);
        setPendingChanges(true);
      }
    }

    props.onSaveDisabled(true);
  }

  props.saveCallback(handleSave);

  const applyDefaultEditorFolding = (editorInstance: IStandaloneCodeEditor): void => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editorInstance.getAction('editor.foldAll').run();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editorInstance.getAction('editor.unfold').run();
  }

  const handleEditorDidMount = (editorInstance: IStandaloneCodeEditor, monaco: Monaco) => {
    applyDefaultEditorFolding(editorInstance);

    editor.current = editorInstance;

    monaco.editor.setTheme(editorTheme);

    monaco.languages.setMonarchTokensProvider('json', JexlFlavouredJSON as any);
  }

  return <div style={{marginTop: "30px", marginLeft: "10px", marginRight: "10px"}}>
    <Box sx={{display: "flex"}}>
      <FormLabel>Config</FormLabel>
      <FormControlLabel control={<Switch checked={diffView} onChange={toggleDiffView} />} label={"Show only changes"} sx={{marginLeft: "auto"}} />
    </Box>
    {invalidConfig &&
        <Alert variant="standard" severity="error">Invalid Cody Play Config. Please check your input!</Alert>}
    <div style={{border: '1px solid #eee'}}>
      <Editor height="400px"
              language="json"
              value={appConfig}
              onMount={handleEditorDidMount}
              onChange={handleConfigChanged}
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
    <Box sx={{display: 'flex'}}>

    </Box>
  </div>
};

export default PlayConfig;

type ConfigKey = keyof CodyPlayConfig;

const nonDiffableKeys = ["appName", "defaultService", "layout", "boardId", "boardName", "origin", "lastEditor", "theme", "personas"];
const specialHandlingKeys = ["eventPolicies"];

const getAppConfigString = (currentAppConfig: CodyPlayConfig, showDiff: boolean, lastPlayshot?: Playshot): string => {
  if(!showDiff || !lastPlayshot) {
    return JSON.stringify(currentAppConfig, null, 2);
  }

  const configDiff: Record<string, string | Record<string, any>> = {};

  for (const configKey in lastPlayshot.playConfig) {
    if(nonDiffableKeys.includes(configKey)) {
      configDiff[configKey] = lastPlayshot.playConfig[configKey as ConfigKey];
      continue;
    }

    const playshotConfig = lastPlayshot.playConfig[configKey as ConfigKey];
    const currentAppConfigConfig = currentAppConfig[configKey as ConfigKey];
    configDiff[configKey] = {};

    for (const subConfigKey in currentAppConfig[configKey as ConfigKey] as any) {

      const playshotSubConfig = (playshotConfig as any)[subConfigKey] as any;
      const currentSubConfig = (currentAppConfigConfig as any)[subConfigKey] as any;

      if(specialHandlingKeys.includes(configKey)) {
        (configDiff[configKey] as any)[subConfigKey] = {};

        for (const subSubConfigKey in currentSubConfig) {
          const playshotSubSubConfig = playshotSubConfig ? playshotSubConfig[subSubConfigKey] : undefined;
          const currentSubSubConfig = currentSubConfig[subSubConfigKey];

          if(!playshotSubSubConfig || JSON.stringify(playshotSubSubConfig) !== JSON.stringify(currentSubSubConfig)) {
            (configDiff[configKey] as any)[subConfigKey][subSubConfigKey] = currentSubSubConfig;
          }
        }

        if(isEmpty((configDiff[configKey] as any)[subConfigKey])) {
          delete (configDiff[configKey] as any)[subConfigKey];
        }

        continue;
      }


      if(!playshotSubConfig || JSON.stringify(playshotSubConfig) !== JSON.stringify(currentSubConfig)) {
        (configDiff[configKey] as any)[subConfigKey] = currentSubConfig;
      }
    }
  }

  return JSON.stringify(configDiff, null, 2);
}

const mergeDiff = (diff: CodyPlayConfig, isDiff: boolean, lastPlayshot?: Playshot): CodyPlayConfig => {
  if(!isDiff || !lastPlayshot) {
    return diff;
  }

  const updatedConfig: CodyPlayConfig = cloneDeepJSON(lastPlayshot.playConfig);

  for (const configKey in diff) {
    if(nonDiffableKeys.includes(configKey)) {
      updatedConfig[configKey as ConfigKey] = diff[configKey as ConfigKey] as any;
      continue;
    }

    const diffConfig = diff[configKey as ConfigKey] as any;

    for (const subConfigKey in diffConfig) {
      if(specialHandlingKeys.includes(configKey)) {
        const diffSubConfig = diffConfig[subConfigKey];

        if(!(updatedConfig[configKey as ConfigKey] as any)[subConfigKey]) {
          (updatedConfig[configKey as ConfigKey] as any)[subConfigKey] = {};
        }

        for (const subSubConfigKey in diffSubConfig) {
          (updatedConfig[configKey as ConfigKey] as any)[subConfigKey][subSubConfigKey] = diffSubConfig[subSubConfigKey];
        }

        continue;
      }

      (updatedConfig[configKey as ConfigKey] as any)[subConfigKey] = diffConfig[subConfigKey];
    }
  }

  return updatedConfig;
}
