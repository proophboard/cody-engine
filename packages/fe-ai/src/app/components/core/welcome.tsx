import {environment} from "@frontend-ai/environments/environment";
import {Flash} from "mdi-material-ui";
import PrototypeMode from "@frontend-ai/app/components/core/prototype/PrototypeMode";
import {Link} from "@mui/material";

const Welcome = (props: {}) => {
  return <>
    <h1>Welcome to {environment.appName}</h1>
    <p><Flash sx={{color: '#f5e339'}} />This application is powered by <Link href="https://github.com/proophboard/cody-engine">Cody Engine</Link><Flash sx={{color: '#f5e339'}} /></p>
    {environment.mode === 'prototype' && <PrototypeMode />}
  </>
}

export default Welcome;
