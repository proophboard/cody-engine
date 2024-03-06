import * as React from 'react';
import {useContext, useEffect, useState} from "react";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import Editor from "@monaco-editor/react";
import {Alert, Box, FormLabel} from "@mui/material";
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
  const {config, dispatch} = useContext(configStore);
  const [appConfig, setAppConfig] = useState(JSON.stringify(config, null, 2));
  const [invalidConfig, setInvalidConfig] = useState(false);
  const {setPendingChanges} = useContext(PendingChangesContext);

  useEffect(() => {
    setAppConfig(JSON.stringify(config, null, 2));
    props.onSaveDisabled(true);
  }, [config]);

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
        payload: newPlayConfig
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

  const handleEditorDidMount = (editorInstance: IStandaloneCodeEditor) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editorInstance.getAction('editor.foldAll').run();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editorInstance.getAction('editor.unfold').run();
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

    </Box>
  </div>
};

export default PlayConfig;
