import * as React from 'react';
import {AccountSchool, Flash, Lightbulb, OpenInNew} from "mdi-material-ui";
import {Alert, Box, Button, IconButton, Link, Typography} from "@mui/material";
import PersonaCard from "@frontend/app/components/core/prototype/PersonaCard";
import Grid2 from "@mui/material/Unstable_Grid2";
import {useContext, useState} from "react";
import {configStore} from "@cody-play/state/config-store";
import {Person} from "@mui/icons-material";
import PlayPersonaModal from "@cody-play/app/components/core/PlayPersonaModal";

interface OwnProps {

}

type PlayWelcomeProps = OwnProps;

const PlayWelcome = (props: PlayWelcomeProps) => {
  const {config} = useContext(configStore);
  const personasCards = config.personas.map(persona => <PersonaCard persona={persona} key={persona.userId} />)
  const [personaModalOpen, setPersonaModalOpen] = useState(false);

  return <>
    <h1>Welcome to {config.appName}</h1>
    <p><Flash sx={{color: '#f5e339'}} />This application is powered by <Link href="https://github.com/proophboard/cody-engine">Cody Engine</Link><Flash sx={{color: '#f5e339'}} /></p>
    <Box sx={{marginTop: '30px', maxWidth: '1000px'}}>
      <p>
        Cody Play is a <strong>browser-only prototyping app</strong>. Design an event model on <Link href="https://free.prooph-board.com">prooph board</Link> and test it on-the-fly.
      </p>
      <Alert severity="info"
             icon={<AccountSchool />}
             title="Go to tutorial"
             action={<IconButton size="small" component={Link} href="https://wiki.prooph-board.com/cody_play/tutorial.html"><OpenInNew /></IconButton>}
      >
        New to Cody Play? We've prepared a tutorial to teach you the basics.
      </Alert>
      <p>
        Data and configuration can be saved in <Link href="https://wiki.prooph-board.com/cody_play/playshots.html">Playshots</Link>.
      </p>
      <p>
        Cody Play is rapid prototyping on steroids 🚀.
        It helps you to answer these questions:
      </p>
      <ul>
        <li>Are all needed information available?</li>
        <li>Can process steps be automated with the help of events?</li>
        <li>Is the task-based UI aligned with the domain model?</li>
        <li>Does the solution serve user needs well?</li>
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
      <p>
        <Button variant="contained"
                startIcon={<Person />}
                color={'primary'}
                onClick={() => setPersonaModalOpen(true)}
        >Manage Personas</Button>
      </p>
    </Box>
    <PlayPersonaModal open={personaModalOpen} onClose={() => setPersonaModalOpen(false)} />
  </>
};

export default PlayWelcome;
