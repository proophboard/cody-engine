import * as React from 'react';
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {useContext, useEffect, useState} from "react";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {saveDataToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import {Alert, Box, Button, CircularProgress, FormLabel, TextField} from "@mui/material";
import Editor from "@monaco-editor/react";
import {DeleteForever, Send} from "mdi-material-ui";
import {editor} from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {useQueryClient} from "@tanstack/react-query";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";

interface OwnProps {
  saveCallback: (cb: () => void) => void;
  onSaveDisabled: (disabled: boolean) => void;
}

type DatabaseProps = OwnProps;

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();

const Database = (props: DatabaseProps) => {

  const database = {
    eventStore: es.syncExportStreams(),
    documentStore: ds.syncExportDocuments(),
  };
  const databaseStr = JSON.stringify(database, null, 2);

  const [updatedDatabaseStr, setUpdatedDatabaseStr] = useState(databaseStr);
  const [invalidDatabase, setInvalidDatabase] = useState(false);
  const [republishEventId, setRepublishEventId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [stream, setStream] = useState('write_model_stream');
  const {setPendingChanges} = useContext(PendingChangesContext);
  const queryClient = useQueryClient();

  useEffect(() => {
    setUpdatedDatabaseStr(databaseStr);
    props.onSaveDisabled(true);
  }, [databaseStr]);

  const validateDatabase = (editorVal: string): {eventStore: Record<string, any>, documentStore: Record<string, any>} | undefined => {

    try {
      const newDatabase = JSON.parse(editorVal);
      setInvalidDatabase(false);
      return newDatabase;
    } catch (e) {
      setInvalidDatabase(true);
      props.onSaveDisabled(true);
    }
  }

  const handleDatabaseChanged = (editorVal: string | undefined) => {
    if(!editorVal) {
      editorVal = '{"eventStore": {}, "documentStore": {}}';
    }

    setUpdatedDatabaseStr(editorVal);
    props.onSaveDisabled(false);

    if(invalidDatabase) {
      validateDatabase(editorVal);
    }
  }

  const handleRepublish = () => {
    let eventToRepublish = republishEventId;

    if(!republishEventId) {
      const streams = es.syncExportStreams();

      if(streams[stream]) {
        const events = [...Object.values(streams[stream])];

        const lastEvent = events.pop();

        if(lastEvent) {
          setRepublishEventId(lastEvent.uuid);
          eventToRepublish = lastEvent.uuid;
        }
      }
    }

    setIsPublishing(true);

    (async () => {
      await es.republish(stream, {$eventId: eventToRepublish});

      window.setTimeout(() => {
        setRepublishEventId('');
        setIsPublishing(false);
      }, 3000);
    })().catch((e: any) => {throw e});
  }

  const handleSave = () => {
    (async () => {
      const newDatabase = validateDatabase(updatedDatabaseStr);
      const boardId = currentBoardId();

      if(newDatabase && boardId) {
        await ds.importDocuments(newDatabase.documentStore);
        await es.importStreams(newDatabase.eventStore);
        await saveDataToLocalStorage(ds, es, boardId);
        props.onSaveDisabled(true);
        await queryClient.invalidateQueries();
        setPendingChanges(true);
      }
    })()
      .catch((e: any) => {
        throw e
      });
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
    <Box sx={{display: 'flex', marginBottom: "20px"}}>
      <TextField
        id="republish"
        placeholder={"EVENT UUID"}
        variant="standard"
        value={republishEventId}
        helperText={<span>Republish an event to trigger policies. Leave empty to republish last recorded event.</span>}
        onChange={(e: any) => setRepublishEventId(e.target.value)}
      />
      <Button
        children={isPublishing? 'Check Browser Console for logs' : 'Republish'}
        startIcon={isPublishing? <CircularProgress size={20}/> : <Send/>}
        disabled={isPublishing}
        onClick={handleRepublish}
        sx={{marginLeft: (theme) => theme.spacing(2)}}
        />
    </Box>
    <FormLabel>Data</FormLabel>
    {invalidDatabase &&
        <Alert variant="standard" severity="error">Invalid Database Update. Please check your input!</Alert>}
    <div style={{border: '1px solid #eee'}}>
      <Editor height="400px"
              language="json"
              value={updatedDatabaseStr}
              onMount={handleEditorDidMount}
              onChange={handleDatabaseChanged}
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
    <Box sx={{display: 'flex', color: (theme) => theme.palette.text.secondary}}>
      <Button
        children={'Clear Data'}
        startIcon={<DeleteForever/>}
        color={"inherit"}
        title={'Empty the Cody Play Database'}
        onClick={() => handleDatabaseChanged(undefined)}
      />
    </Box>
  </div>
};

export default Database;
