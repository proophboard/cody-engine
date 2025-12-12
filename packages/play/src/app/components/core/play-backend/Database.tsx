import * as React from 'react';
import {
  getConfiguredPlayEventStore,
  PLAY_WRITE_MODEL_STREAM
} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {useContext, useEffect, useRef, useState} from "react";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {saveDataToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import {
  Alert,
  Box,
  Button,
  CircularProgress, FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem, Switch,
  TextField, useMediaQuery,
  useTheme
} from "@mui/material";
import Editor, {Monaco} from "@monaco-editor/react";
import {DeleteForever, Send} from "mdi-material-ui";
import {editor} from "monaco-editor";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import {useQueryClient} from "@tanstack/react-query";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import {
  DocumentStoreInformationService
} from "@server/infrastructure/information-service/document-store-information-service";
import {TypeRegistry} from "@event-engine/infrastructure/TypeRegistry";
import {
  isDeleteInformation, isExecuteRules, isForEach,
  isInsertInformation, isReplaceInformation,
  isUpdateInformation,
  isUpsertInformation,
  Rule
} from "@app/shared/rule-engine/configuration";
import {Videocam} from "@mui/icons-material";
import {
  getConfiguredPlayReadModelProjector
} from "@cody-play/infrastructure/multi-model-store/configured-play-read-model-projector";
import {getConfiguredPlayAuthService} from "@cody-play/infrastructure/auth/configured-auth-service";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {InMemoryStreamStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {Backup, Documents, Sequences} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {Playshot} from "@cody-play/infrastructure/cody/cody-message-server";
import {set} from "lodash";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";

type ProjectionRegistry = Record<string, {collection: string, stream: string}>;

interface OwnProps {
  saveCallback: (cb: () => void) => void;
  onSaveDisabled: (disabled: boolean) => void;
}

type DatabaseProps = OwnProps;

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();

const DEFAULT_EDITOR_HEIGHT = 250;

type DatabaseSnapshot = {
  eventStore: InMemoryStreamStore,
  documentStore: Backup
}

let diffView = false;

let currentOnSaveDisabled: (disabled: boolean) => void = () => {};

const Database = (props: DatabaseProps) => {

  currentOnSaveDisabled = props.onSaveDisabled;

  const database: DatabaseSnapshot = {
    eventStore: es.syncExportStreams(),
    documentStore: ds.syncExportBackup(),
  };


  const theme = useTheme();
  const [invalidDatabase, setInvalidDatabase] = useState(false);
  const [republishEventId, setRepublishEventId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [stream, setStream] = useState(PLAY_WRITE_MODEL_STREAM);
  const {config, lastPlayshot} = useContext(configStore);
  const {setPendingChanges} = useContext(PendingChangesContext);
  const queryClient = useQueryClient();
  const [projections, setProjections] = useState<ProjectionRegistry>({});
  const [selectedProjection, setSelectedProjection] = useState<string>('');
  const [isRunningProjection, setIsRunningProjection] = useState(false);
  const [projectionSetupError, setProjectionSetupError] = useState<string|undefined>();
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');
  const [editorHeight, setEditorHeight] = useState(DEFAULT_EDITOR_HEIGHT);
  const editor = useRef<IStandaloneCodeEditor>();
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const databaseStr = getDatabaseString(database, diffView, lastPlayshot);

  const [updatedDatabaseStr, setUpdatedDatabaseStr] = useState(databaseStr);

  useEffect(() => {
    setUpdatedDatabaseStr(databaseStr);
    props.onSaveDisabled(true);
  }, [databaseStr]);

  useEffect(() => {
    const infoService = new DocumentStoreInformationService(ds, config.types as unknown as TypeRegistry);
    try {
      setProjections(getProjections(config, infoService));
    } catch (e: any) {
      setProjectionSetupError(e.toString());
    }

  }, [config.types]);

  useEffect(() => {
    window.setTimeout(() => {
      setEditorTheme(theme.palette.mode === 'dark' ? 'vs-dark' : 'vs');
    },10);
  }, [theme.palette.mode]);

  const toggleDiffView = () => {
    diffView = !diffView;
    setUpdatedDatabaseStr(getDatabaseString(database, diffView, lastPlayshot));

    window.setTimeout(() => {
      if(editor.current) {
        applyDefaultEditorFolding(editor.current);
      }
    }, 200);
  }

  const validateDatabase = (editorVal: string): {eventStore: Record<string, any>, documentStore: {
    documents: Record<string, any>,
    sequences: Record<string, any>
    }} | undefined => {

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
      editorVal = '{"eventStore": {}, "documentStore": {"documents": {}, "sequences": {}}}';
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
      await es.republish(stream, getConfiguredPlayAuthService(), {$eventId: eventToRepublish});

      window.setTimeout(() => {
        setRepublishEventId('');
        setIsPublishing(false);

        window.setTimeout(() => {
          currentOnSaveDisabled(false);
        }, 300);
      }, 3000);
    })().catch((e: any) => {throw e});
  }

  const handleRerunProjection = () => {
    if(selectedProjection) {
      setIsRunningProjection(true);

      const prjConfig = projections[selectedProjection];

      (async () => {
        await ds.dropCollection(prjConfig.collection);

        const projector = getConfiguredPlayReadModelProjector(config);

        await projector.run(prjConfig.stream, undefined, selectedProjection);

        window.setTimeout(() => {
          setSelectedProjection('');
          setIsRunningProjection(false);
          window.setTimeout(() => {
            currentOnSaveDisabled(false);
          }, 300);
        }, 3000);
      })().catch((e: any) => {throw e})
    }
  }

  const handleSave = () => {
    (async () => {
      const newDatabase = validateDatabase(updatedDatabaseStr);
      const boardId = currentBoardId();

      if(newDatabase && boardId) {
        const mergedDatabase = mergeDiff(newDatabase, diffView, lastPlayshot);
        await ds.importBackup(mergedDatabase.documentStore);
        await es.importStreams(mergedDatabase.eventStore);
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

  const handleEditorDidMount = (editorInstance: IStandaloneCodeEditor, monaco: Monaco) => {
    console.log("editor did mount")
    applyDefaultEditorFolding(editorInstance);

    const eTheme = theme.palette.mode === 'dark' ? 'vs-dark' : 'vs';

    editor.current = editorInstance;

    window.setTimeout(() => {
      setEditorTheme(eTheme);
      monaco.editor.setTheme(eTheme);
    }, 10);
  }

  const applyDefaultEditorFolding = (editorInstance: IStandaloneCodeEditor): void => {
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
        label={"EVENT UUID"}
        variant="standard"
        value={republishEventId}
        helperText={<span>Republish an event to trigger policies. Leave empty to republish last recorded event.</span>}
        onChange={(e: any) => setRepublishEventId(e.target.value)}
        sx={{width: sideBarPersistent ? '45%' : '70%'}}
      />
      <Button
        children={isPublishing? 'Check Browser Console for logs' : 'Republish'}
        startIcon={isPublishing? <CircularProgress size={20}/> : <Send/>}
        disabled={isPublishing}
        onClick={handleRepublish}
        sx={{marginLeft: (theme) => theme.spacing(2)}}
        />
    </Box>
    {projectionSetupError && <Alert severity="error">{projectionSetupError}</Alert>}
    {!projectionSetupError && <Box sx={{display: 'flex', marginBottom: "20px"}}>
      <TextField
        id="rerun_projection"
        label="PROJECTION"
        variant="standard"
        value={selectedProjection}
        helperText={<span>Rerun first clears the collection and then feeds all events into the projection again.</span>}
        disabled={isRunningProjection}
        select={true}
        sx={{width: sideBarPersistent ? '45%' : '70%'}}
        onChange={(e: any) => setSelectedProjection(e.target.value)}
      >
        {Object.keys(projections).map(prj => <MenuItem key={prj} value={prj} selected={prj === selectedProjection}>
          {prj}
        </MenuItem>)}
      </TextField>
      <Button
        children={isRunningProjection ? 'Check Browser Console for logs' : 'Rerun'}
        startIcon={isRunningProjection ? <CircularProgress size={20}/> : <Videocam/>}
        disabled={isRunningProjection || !selectedProjection}
        onClick={handleRerunProjection}
        sx={{marginLeft: (theme) => theme.spacing(2)}}
      />
    </Box>}
    <Box sx={{display: 'flex'}}>
      <FormLabel sx={{paddingTop: "10px"}}>Data</FormLabel>
      <IconButton title={'Click to expand editor. Ctrl+Click to double expand.'} color={editorHeight > DEFAULT_EDITOR_HEIGHT ? 'primary' : 'default'} onClick={e => {
        const isExpanded = editorHeight === 450;
        const isDoubleExpanded = editorHeight === 900;

        let newHeight = 290;

        if(e.ctrlKey) {
          newHeight = isDoubleExpanded ? 450 : 900;
        } else {
          newHeight = isExpanded || isDoubleExpanded ? DEFAULT_EDITOR_HEIGHT : 450;
        }

        setEditorHeight(newHeight);
      }} className={editorHeight > DEFAULT_EDITOR_HEIGHT ? 'active' : ''}><MdiIcon icon="focus-field-horizontal" /></IconButton>
      <FormControlLabel control={<Switch checked={diffView} onChange={toggleDiffView} />} label={"Show only changes"} sx={{marginLeft: "auto"}} />
    </Box>
    {invalidDatabase &&
        <Alert variant="standard" severity="error">Invalid Database Update. Please check your input!</Alert>}
    <div style={{border: '1px solid #eee'}}>
      <Editor height={`${editorHeight}px`}
              language="json"
              value={updatedDatabaseStr}
              onMount={handleEditorDidMount}
              onChange={handleDatabaseChanged}
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



const getProjections = (config: CodyPlayConfig, infoService: DocumentStoreInformationService): ProjectionRegistry => {
  const projections: ProjectionRegistry = {};

  for (const policies of Object.values(config.eventPolicies)) {
    for (const policy of Object.values(policies)) {
      if(policy.projection && !projections[policy.projection]) {
        projections[policy.projection] = {
          collection: detectCollection(policy.projection, policy.rules, infoService),
          stream: PLAY_WRITE_MODEL_STREAM // @TODO: detect stream by inspecting events
        };
      }
    }
  }

  return projections;
}

const detectCollection = (projectionName: string, rules: Rule[], infoService: DocumentStoreInformationService): string => {
  for (const rule of rules) {
    if(isInsertInformation(rule.then)) {
      return infoService.detectCollection(rule.then.insert.information);
    }

    if(isUpsertInformation(rule.then)) {
      return infoService.detectCollection(rule.then.upsert.information);
    }

    if(isUpdateInformation(rule.then)) {
      return infoService.detectCollection(rule.then.update.information);
    }

    if(isReplaceInformation(rule.then)) {
      return infoService.detectCollection(rule.then.replace.information);
    }

    if(isDeleteInformation(rule.then)) {
      return infoService.detectCollection(rule.then.delete.information);
    }

    if(isExecuteRules(rule.then)) {
      return detectCollection(projectionName, rule.then.execute.rules, infoService);
    }

    if(isForEach(rule.then)) {
      return detectCollection(projectionName, [{rule: "always", then: rule.then.forEach.then}], infoService);
    }
  }

  throw new Error(`Cannot detect collection for projection: "${projectionName}", because there are no insert,upsert,update,replace or delete information rules defined, which would allow to detect the collection.`)
}

const getDatabaseString = (currentDatabase: DatabaseSnapshot, showDiff: boolean, lastPlayshot?: Playshot): string => {
  if(!showDiff || !lastPlayshot) {
    return JSON.stringify(currentDatabase, null, 2);
  }

  const streamsDiff: InMemoryStreamStore = {};
  const documentsDiff: Documents = {};
  const checkedStreams: string[] = [];
  const checkedCollections: string[] = [];

  // Diff streams
  for (const streamName in lastPlayshot.playData.streams) {
    const stream = lastPlayshot.playData.streams[streamName];

    checkedStreams.push(streamName);

    const existingEventIds: string[] = stream.map(e => e.uuid);

    if(currentDatabase.eventStore[streamName]) {
      currentDatabase.eventStore[streamName].forEach(event => {
        if(!existingEventIds.includes(event.uuid)) {
          if(!streamsDiff[streamName]) {
            streamsDiff[streamName] = [];
          }

          streamsDiff[streamName].push(event);
        }
      })
    }
  }

  for (const streamName in currentDatabase.eventStore) {
    if(!checkedStreams.includes(streamName)) {
      streamsDiff[streamName] = currentDatabase.eventStore[streamName];
    }
  }

  // Diff documents
  for (const collectionName in lastPlayshot.playData.documents) {
    const collection = lastPlayshot.playData.documents[collectionName];

    checkedCollections.push(collectionName);

    if(currentDatabase.documentStore.documents[collectionName]) {
      for (const docId in currentDatabase.documentStore.documents[collectionName]) {
        if(collection[docId]) {
          if(JSON.stringify(collection[docId]) !== JSON.stringify(currentDatabase.documentStore.documents[collectionName][docId])) {
            set(documentsDiff, `${collectionName}.${docId}`, currentDatabase.documentStore.documents[collectionName][docId]);
          }
        } else {
          set(documentsDiff, `${collectionName}.${docId}`, currentDatabase.documentStore.documents[collectionName][docId]);
        }
      }
    }
  }

  for (const collectionName in currentDatabase.documentStore.documents) {
    if(!checkedCollections.includes(collectionName)) {
      documentsDiff[collectionName] = currentDatabase.documentStore.documents[collectionName];
    }
  }

  const diff: DatabaseSnapshot = {
    eventStore: streamsDiff,
    documentStore: {
      documents: documentsDiff,
      sequences: currentDatabase.documentStore.sequences,
    }
  }

  return JSON.stringify(diff, null, 2);
}

const mergeDiff = (diff: DatabaseSnapshot, isDiff: boolean, lastPlayshot?: Playshot): DatabaseSnapshot => {
  if(!isDiff || !lastPlayshot) {
    return diff;
  }

  const updatedPlayshotSnapshot: DatabaseSnapshot = {
    eventStore: cloneDeepJSON(lastPlayshot.playData.streams),
    documentStore: {
      documents: cloneDeepJSON(lastPlayshot.playData.documents),
      sequences: lastPlayshot.playData.sequences || {}
    }
  }

  for (const streamName in diff.eventStore) {
    if(!updatedPlayshotSnapshot.eventStore[streamName]) {
      updatedPlayshotSnapshot.eventStore[streamName] = [];
    }

    updatedPlayshotSnapshot.eventStore[streamName].push(...diff.eventStore[streamName]);
  }

  for (const collectionName in diff.documentStore.documents) {
    if(!updatedPlayshotSnapshot.documentStore.documents[collectionName]) {
      updatedPlayshotSnapshot.documentStore.documents[collectionName] = {};
    }

    updatedPlayshotSnapshot.documentStore.documents[collectionName] = {
      ...updatedPlayshotSnapshot.documentStore.documents[collectionName],
      ...diff.documentStore.documents[collectionName]
    };
  }

  updatedPlayshotSnapshot.documentStore.sequences = diff.documentStore.sequences;

  return updatedPlayshotSnapshot;
}

