import * as React from 'react';
import {Box} from "@mui/material";
import {FileDocumentAlertOutline} from "mdi-material-ui";

interface OwnProps {

}

type NoRowsOverlayProps = OwnProps;

const NoRowsOverlay = (props: NoRowsOverlayProps) => {
  return <Box sx={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: theme => theme.palette.text.disabled}}>
    <span>
      <FileDocumentAlertOutline color="disabled" sx={{fontSize: '60px'}} />
    </span>
    <span>&nbsp;&nbsp;Nothing to show</span>
  </Box>
};

export default NoRowsOverlay;
