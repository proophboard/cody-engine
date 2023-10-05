import * as React from 'react';
import Grid2 from "@mui/material/Unstable_Grid2";
import {Alert, Box, Link, Typography} from "@mui/material";
import {Personas} from "@app/shared/extensions/personas";
import {Lightbulb} from "mdi-material-ui";
import PersonaCard from "@frontend/app/components/core/prototype/PersonaCard";

interface OwnProps {

}

type PrototypeModeProps = OwnProps;

const PrototypeMode = (props: PrototypeModeProps) => {
  const personasCards = Personas.map(persona => <PersonaCard persona={persona} key={persona.userId} />)

  return <Box sx={{marginTop: '30px', maxWidth: '1000px'}}>
    <p>
      <strong>Prototype</strong> mode is activated. All data is stored in the local filesystem ( <i>[project_root]/data</i> ) and authentication is disabled.
      As the mode suggests, it is meant to be used for rapid prototyping. Try out ideas and different designs. Validate data and user flow through the system.
      Cody Engine should help you answer questions like:
    </p>
    <ul>
      <li>Are all needed information available?</li>
      <li>Can process steps be automated with the help of events?</li>
      <li>Is the task-based UI aligned with the domain model?</li>
      <li>Does the solution serve user needs well?</li>
    </ul>
    <Alert variant="outlined" severity="info" icon={<Lightbulb sx={{color: '#f5e339'}} />}>
      <i>It's possible to turn the prototype into a production-ready application by connecting it to a real database (Postgres) and set up an authentication server like Keycloak.
        Please contact the <Link href="https://prooph-software.de/#board">prooph board team</Link> for more information.</i>
    </Alert>
    <Typography variant="h3" display="block" width={'100%'} marginTop={'30px'}>Personas</Typography>
    <p>Instead of real users, you can switch personas in prototype mode. Personas can be configured in <i>[project_root]/packages/shared/extensions/personas.ts</i></p>
    <Grid2 container={true} rowSpacing={2} spacing={2} sx={{alignItems: 'stretch'}}>
      {personasCards}
    </Grid2>
  </Box>
};

export default PrototypeMode;
