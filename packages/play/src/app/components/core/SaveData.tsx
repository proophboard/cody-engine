import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  TextField,
  Typography, useMediaQuery, useTheme
} from "@mui/material";
import {ContentSaveAlertOutline, ContentSaveCheckOutline, ContentSaveOutline, ZipDisk} from "mdi-material-ui";
import {useContext, useEffect, useRef, useState} from "react";
import {SnackbarMessage, useSnackbar} from "notistack";
import {Check, UploadOutlined} from "@mui/icons-material";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {saveToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";
import {savePlayshot} from "@cody-play/app/components/core/CodyMessageServer";
import {ColorModeContext} from "@frontend/app/providers/ToggleColorMode";
import {useVibeCodyAi} from "@cody-play/hooks/use-vibe-cody-ai";
import {v4} from "uuid";
import {Playshot} from "@cody-play/infrastructure/cody/cody-message-server";
import {stringify} from "@app/shared/utils/stringify";
import {names} from "@event-engine/messaging/helpers";

interface OwnProps {
  color?: string;
}

type SaveDataProps = OwnProps;

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();
let firstRun = true;
const failedToSaveMessage = `Could not save data. The prooph board reference id is missing. Please reopen Cody Play from prooph board and try again!`;

const exportPlayshot = async (name: string, config: CodyPlayConfig) => {
  const es = getConfiguredPlayEventStore();
  const ds = getConfiguredPlayDocumentStore();

  const playshot: Playshot = {
    playshotId: v4(),
    name,
    boardId: config.boardId,
    playConfig: config,
    playData: {
      streams: await es.exportStreams(),
      ...await ds.exportBackup()
    }
  }

  const fileName = names(name).fileName + '.json';
  const blob = new Blob([stringify(playshot, undefined, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const SaveData = (props: SaveDataProps) => {
  const [saved, setSaved] = useState(false);
  const snackbar = useSnackbar();
  const {config} = useContext(configStore);
  const {pendingChanges, setPendingChanges} = useContext(PendingChangesContext);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [playshotName, setPlayshotName] = useState('');
  const inputRef = useRef<HTMLInputElement>();
  const {mode} = useContext(ColorModeContext);
  const theme = useTheme();
  const [isVibeCody] = useVibeCodyAi();

  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const openDialog = () => {
    setSaveDialogOpen(true);

    window.setTimeout(() => {
      if(inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }

  const saveLocal = () => {
    setPendingChanges(true);
    const boardId = currentBoardId();
    if(boardId) {
      saveToLocalStorage(config, ds, es, boardId).catch(e => {
        throw e
      });
    }
  }

  useEffect(() => {
    if(!firstRun) {
      saveLocal();
    } else {
      window.setTimeout(() => {
        firstRun = false;
      }, 500);
    }
  }, [config]);

  useEffect(() => {
    es.attachAppendToListener(() => {
      saveLocal();
    })
  })

  const submitPlayshot = () => {
    if(isVibeCody) {
      exportPlayshot(playshotName || 'playshot', config)
        .then(() => {
          setSaved(true);
          setPendingChanges(false);
          setSaveDialogOpen(false);
          setTimeout(() => {
            setSaved(false);
          }, 3000);
        })
        .catch(e => snackbar.enqueueSnackbar({message: e, variant: "error"}));
      return;
    }

    const boardId = currentBoardId();
    if(boardId) {
      savePlayshot(playshotName || 'Unnamed Playshot', boardId).then((success) => {
        if(success) {
          setSaved(true);
          snackbar.enqueueSnackbar({message: <p>Cody Playshot saved successfully.</p>, variant: "success"})
          setPendingChanges(false);
          setSaveDialogOpen(false);
          setTimeout(() => {
            setSaved(false);
          }, 3000);
        } else {
          snackbar.enqueueSnackbar({message: failedToSaveMessage, variant: "error"})
        }
      });
    } else {
      snackbar.enqueueSnackbar({message: failedToSaveMessage, variant: "error"})
    }
  }

  return <>
      {pendingChanges && sideBarPersistent && <Typography variant="subtitle2" sx={{display: "inline-block", color: props.color}}>You have unsaved changes!&nbsp;&nbsp;&nbsp;</Typography>}
      <IconButton
                       title="Save config and data"
                       disabled={saved}
                       sx={{color: props.color}}
                       onClick={openDialog}>
      {saved? <ContentSaveCheckOutline /> : pendingChanges ? <ContentSaveAlertOutline /> : <ContentSaveOutline />}
    </IconButton>
    <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
      <DialogTitle>Save Playshot</DialogTitle>
      <DialogContent>
        <Typography>Make a playshot with a descriptive name to remember it later.</Typography>
        <p></p>
        <TextField label='Playshot Name' inputRef={inputRef} value={playshotName} name="playshotname" fullWidth={true} onChange={e => setPlayshotName(e.target.value)} autoFocus={true} onKeyUp={e => e.key === 'Enter'? submitPlayshot() : true } />
        <p></p>
        {!isVibeCody && <Alert severity={"info"} variant={"standard"} sx={{marginTop: '30px'}}>View and load Playshots on prooph board.
          They are listed in the "Cody Play" dialog, that can be accessed from the board top menu.</Alert>}
        {isVibeCody && <Alert severity={"info"} variant={"standard"} sx={{marginTop: '30px'}}>You can reimport the playshot on the welcome page. It's also possible to open Vibe Cody on prooph board. This will connect the app with an event model. Learn more about it <Link href="https://wiki.prooph-board.com/cody_play/vibe-cody.html">here</Link></Alert>}
      </DialogContent>
      <DialogActions>
        <Button
          children={'Close'}
          onClick={() => setSaveDialogOpen(false)}
          color={'secondary'}
        />
        <Button
          variant={'contained'}
          color={'primary'}
          startIcon={ <UploadOutlined />}
          sx={{ textTransform: 'none', margin: '5px' }}
          onClick={submitPlayshot}
        >
          {'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  </>
};

export default SaveData;
