import * as React from 'react';
import {Box, Button, IconButton, Typography} from "@mui/material";
import {ZipDisk} from "mdi-material-ui";
import {useContext, useEffect, useState} from "react";
import {useSnackbar} from "notistack";
import {Check} from "@mui/icons-material";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {saveToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import {configStore} from "@cody-play/state/config-store";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {PendingChangesContext} from "@cody-play/infrastructure/multi-model-store/PendingChanges";

interface OwnProps {

}

type SaveDataProps = OwnProps;

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();
let firstRun = true;
const SaveData = (props: SaveDataProps) => {
  const [saved, setSaved] = useState(false);
  const snackbar = useSnackbar();
  const {config} = useContext(configStore);
  const {pendingChanges, setPendingChanges} = useContext(PendingChangesContext);


  useEffect(() => {
    if(!firstRun) {
      setPendingChanges(true);
    } else {
      window.setTimeout(() => {
        firstRun = false;
      }, 500);
    }
  }, [config]);

  const handleClick = () => {
    const boardId = currentBoardId();
    if(boardId) {
      saveToLocalStorage(config, ds, es, boardId).then(() => {
        setSaved(true);
        snackbar.enqueueSnackbar({message: <p>Cody Play config and data successfully saved in local storage.<br /><small>Clear storage to reset.</small></p>, variant: "success"})
        setPendingChanges(false);
        setTimeout(() => {
          setSaved(false);
        }, 3000);
      });
    } else {
      snackbar.enqueueSnackbar({message: `Could not save data. The prooph board reference id is missing. Please reopen Cody Play from prooph board and try again!`, variant: "error"})
    }
  }

  return <Box sx={{position: "fixed", bottom: "20px", right: "40px", }}>
    {pendingChanges && <Typography variant="subtitle2" sx={{display: "inline-block"}} color="primary">You have unsaved changes!&nbsp;&nbsp;&nbsp;</Typography>}
    <IconButton size="large"
                     color="primary"
                     title="Save config and data"
                     disabled={saved}
                     onClick={handleClick}
                     sx={{backgroundColor: theme => theme.palette.grey.A200}}>
    {saved? <Check /> : <ZipDisk/>}
  </IconButton>
  </Box>
};

export default SaveData;
