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
  TextField,
  Typography
} from "@mui/material";
import {ZipDisk} from "mdi-material-ui";
import {useContext, useEffect, useRef, useState} from "react";
import {SnackbarMessage, useSnackbar} from "notistack";
import {Check} from "@mui/icons-material";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {saveToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import {configStore} from "@cody-play/state/config-store";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";
import {savePlayshot} from "@cody-play/app/components/core/CodyMessageServer";

interface OwnProps {

}

type SaveDataProps = OwnProps;

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();
let firstRun = true;
const failedToSaveMessage = `Could not save data. The prooph board reference id is missing. Please reopen Cody Play from prooph board and try again!`;

const SaveData = (props: SaveDataProps) => {
  const [saved, setSaved] = useState(false);
  const snackbar = useSnackbar();
  const {config} = useContext(configStore);
  const {pendingChanges, setPendingChanges} = useContext(PendingChangesContext);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [playshotName, setPlayshotName] = useState('');
  const inputRef = useRef<HTMLInputElement>();

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
      <Box sx={{position: "fixed", bottom: "20px", right: "40px", }}>
        {pendingChanges && <Typography variant="subtitle2" sx={{display: "inline-block"}} color="primary">You have unsaved changes!&nbsp;&nbsp;&nbsp;</Typography>}
        <IconButton size="large"
                         color="primary"
                         title="Save config and data"
                         disabled={saved}
                         onClick={openDialog}
                         sx={{backgroundColor: theme => theme.palette.grey.A200}}>
        {saved? <Check /> : <ZipDisk/>}
      </IconButton>
    </Box>
    <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
      <DialogTitle>Save Playshot</DialogTitle>
      <DialogContent>
        <Typography>Make a Cody Play snapshot with a descriptive name to remember it later.</Typography>
        <p></p>
        <TextField label='Playshot Name' inputRef={inputRef} value={playshotName} name="playshotname" fullWidth={true} onChange={e => setPlayshotName(e.target.value)} autoFocus={true} onKeyUp={e => e.key === 'Enter'? submitPlayshot() : true } />
        <p></p>
        <Alert severity={"info"} variant={"standard"} sx={{marginTop: '30px'}}>View and load Playshots on prooph board. They are listed in the "Cody Play" dialog, that can be accessed from the board top menu.</Alert>
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
          startIcon={ <ZipDisk />}
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
