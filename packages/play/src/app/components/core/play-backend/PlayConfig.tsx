import * as React from 'react';
import {useContext, useEffect, useState} from "react";
import {CodyPlayConfig, configStore, getEditedContextFromConfig} from "@cody-play/state/config-store";
import Editor, {Monaco} from "@monaco-editor/react";
import {Alert, Box, FormLabel, useTheme} from "@mui/material";
import {editor} from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {saveConfigToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-config-to-local-storage";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";

interface OwnProps {
  saveCallback: (cb: () => void) => void;
  onSaveDisabled: (disabled: boolean) => void;
}

type PlayConfigProps = OwnProps;

const PlayConfig = (props: PlayConfigProps) => {
  const theme = useTheme();
  const {config, dispatch} = useContext(configStore);
  const [appConfig, setAppConfig] = useState(JSON.stringify(config, null, 2));
  const [invalidConfig, setInvalidConfig] = useState(false);
  const {setPendingChanges} = useContext(PendingChangesContext);
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');

  useEffect(() => {
    setAppConfig(JSON.stringify(config, null, 2));
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

  const handleSave = () => {
    const newPlayConfig = validateConfig(appConfig);

    if(newPlayConfig) {
      dispatch({
        type: "INIT",
        payload: newPlayConfig,
        ctx: getEditedContextFromConfig(newPlayConfig)
      })
    }

    const boardId = currentBoardId();

    if(newPlayConfig && boardId) {
      saveConfigToLocalStorage({...newPlayConfig}, boardId);
      setPendingChanges(true);
    }

    props.onSaveDisabled(true);
  }

  props.saveCallback(handleSave);

  const handleEditorDidMount = (editorInstance: IStandaloneCodeEditor, monaco: Monaco) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editorInstance.getAction('editor.foldAll').run();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editorInstance.getAction('editor.unfold').run();

    monaco.editor.setTheme(editorTheme);
  }

  return <div style={{marginTop: "30px", marginLeft: "10px", marginRight: "10px"}}>
    <FormLabel>Config</FormLabel>
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
