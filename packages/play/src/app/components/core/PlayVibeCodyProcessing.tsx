import Typography from '@mui/material/Typography';
import * as React from 'react';
import {Box, LinearProgress} from "@mui/material";

interface OwnProps {

}

type PlayVibeCodyProcessingProps = OwnProps;

const PlayVibeCodyProcessing = (props: PlayVibeCodyProcessingProps) => {
  return <>
    <Typography variant={'h1'}>Hang tight, Cody is processing your instruction!</Typography>
    <Box sx={{marginTop: theme => theme.spacing(4)}}>
      <LinearProgress  />
    </Box>
  </>
};

export default PlayVibeCodyProcessing;
