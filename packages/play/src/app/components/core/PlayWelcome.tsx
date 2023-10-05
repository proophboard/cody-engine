import * as React from 'react';
import {Flash, Lightbulb} from "mdi-material-ui";
import {Alert, Box, Link, Typography} from "@mui/material";
import {Personas} from "@app/shared/extensions/personas";
import PersonaCard from "@frontend/app/components/core/prototype/PersonaCard";
import Grid2 from "@mui/material/Unstable_Grid2";
import {useContext} from "react";
import {configStore} from "@cody-play/state/config-store";

interface OwnProps {

}

type PlayWelcomeProps = OwnProps;

const PlayWelcome = (props: PlayWelcomeProps) => {
  const {config} = useContext(configStore);
  const personasCards = Personas.map(persona => <PersonaCard persona={persona} key={persona.userId} />)

  return <>
    <h1>Welcome to {config.appName}</h1>
    <p><Flash sx={{color: '#f5e339'}} />This application is powered by <Link href="https://github.com/proophboard/cody-engine">Cody Engine</Link><Flash sx={{color: '#f5e339'}} /></p>
    <Box sx={{marginTop: '30px', maxWidth: '1000px'}}>
      <p>
        Cody Play is a <strong>browser-only prototyping app</strong>. Design an event model on <Link href="https://free.prooph-board.com">prooph board</Link> and test the design here in Cody Play.
        Data and configuration can be saved in the browser's local storage by using the button at the bottom right corner.
      </p>
      <p>
        Cody Play is meant to be used for rapid prototyping within a design session on prooph board. Try out ideas and different designs. Validate data and user flow through the system.
        Cody Play should help you answer questions like:
      </p>
      <ul>
        <li>Is the task-based UI aligned with the domain model?</li>
        <li>Does it serve user needs well?</li>
      </ul>
      <Alert variant="outlined" severity="info" icon={<Lightbulb sx={{color: '#f5e339'}} />}>
        <i>It's possible to turn the prototype into a production-ready application by installing <Link href="https://github.com/proophboard/cody-engine">Cody Engine</Link> locally and connecting it to a real database (Postgres) and set up an authentication server like Keycloak.
          Please contact the <Link href="https://prooph-software.de/#board">prooph board team</Link> for more information.</i>
      </Alert>
      <Typography variant="h3" display="block" width={'100%'} marginTop={'30px'}>Personas</Typography>
      <p>Instead of real users, you can switch personas in prototype mode.</p>
      <Grid2 container={true} rowSpacing={2} spacing={2} sx={{alignItems: 'stretch'}}>
        {personasCards}
      </Grid2>
    </Box>
  </>
};

export default PlayWelcome;
