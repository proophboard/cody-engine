import * as React from 'react';
import {AccountSchool, Flash, Lightbulb, OpenInNew} from "mdi-material-ui";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from "@mui/material";
import PersonaCard from "@frontend/app/components/core/prototype/PersonaCard";
import Grid2 from "@mui/material/Grid";
import {useContext, useEffect, useState} from "react";
import {configStore, enhanceConfigWithDefaults, initialPlayConfig} from "@cody-play/state/config-store";
import {Person} from "@mui/icons-material";
import PlayPersonaModal from "@cody-play/app/components/core/PlayPersonaModal";
import {useVibeCodyAi} from "@cody-play/hooks/use-vibe-cody-ai";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {Playshot} from "@cody-play/infrastructure/cody/cody-message-server";
import {Map} from "immutable";
import {Node} from "@proophboard/cody-types";
import {names} from "@event-engine/messaging/helpers";
import {saveToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-to-local-storage";
import {getConfiguredPlayEventStore} from "@cody-play/infrastructure/multi-model-store/configured-event-store";
import {getConfiguredPlayDocumentStore} from "@cody-play/infrastructure/multi-model-store/configured-document-store";
import {setCurrentBoardId} from "@cody-play/infrastructure/utils/current-board-id";
import {v4} from "uuid";
import {enqueueSnackbar} from "notistack";
import {FileDropzone} from "@cody-play/app/components/core/FileDropzone";
import {parseJson} from "@app/shared/utils/parse-json";
import {getRjsfValidator} from "@frontend/util/rjsf-validator";
import {PlayshotSchema} from "@cody-play/state/playshot.schema";

interface OwnProps {

}

type PlayWelcomeProps = OwnProps;

const es = getConfiguredPlayEventStore();
const ds = getConfiguredPlayDocumentStore();

const PlayWelcome = (props: PlayWelcomeProps) => {
  const {config, dispatch} = useContext(configStore);
  const personasCards = config.personas.map(persona => <PersonaCard persona={persona} key={persona.userId} />)
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [isVibeCody] = useVibeCodyAi();

  const initPlayshot = async (playshot: Playshot) => {
    dispatch({
      type: 'INIT',
      payload: playshot.playConfig,
      ctx: {
        boardId: playshot.boardId,
        userId: '',
        boardName: '',
        origin: 'vibe-cody.ai',
        service: names(playshot.playConfig.defaultService).className,
        syncedNodes: Map<string, Node>()
      }
    })

    await es.importStreams(playshot.playData.streams || {});
    await ds.importBackup({
      documents: playshot.playData.documents || {},
      sequences: playshot.playData.sequences || {}
    });

    await saveToLocalStorage(enhanceConfigWithDefaults(playshot.playConfig), ds, es, playshot.boardId);
    setCurrentBoardId(playshot.boardId);
  }

  useEffect(() => {
    if(!config.boardId && isVibeCody) {
      const boardId = v4();

      initPlayshot({
        playConfig: {...initialPlayConfig, boardId},
        name: 'New vibe-cody.ai Playshot',
        boardId,
        playshotId: v4(),
        playData: {
          streams: {},
          documents: {},
          sequences: {}
        }
      }).catch(e => enqueueSnackbar({message: e + '', variant: "error"}));
    }
  }, [config.boardId, isVibeCody]);

  const handleFileImport = (playshotStr: string, fileName: string)=> {
    try {
      const playshot = parseJson<Playshot>(playshotStr);

      const ajv = getRjsfValidator();

      const validationData = ajv.validateFormData(playshot, PlayshotSchema);

      if(validationData.errors.length) {
        enqueueSnackbar({message: "Failed to import playshot. See browser console for details", variant: "error"});
        console.error("Failed to import playshot: ", validationData);
        return;
      }

      initPlayshot(playshot).then(() => {
        enqueueSnackbar({message: "Successfully imported playshot: " + fileName, variant: "success"});
      }).catch(e => {
        enqueueSnackbar({message: "Failed to import playshot. See browser console for details", variant: "error"});
        console.error("Failed to import playshot: ", e);
      });
    } catch (e) {
      enqueueSnackbar({message: "Failed to import playshot. See browser console for details", variant: "error"});
      console.error("Failed to import playshot: ", e);
    }
  }

  const playName = isVibeCody ? 'vibe-cody.ai' : 'Cody Play';
  const tutorialLink = isVibeCody
    ? 'https://wiki.prooph-board.com/cody_play/vibe-cody.html'
    : 'https://wiki.prooph-board.com/cody_play/tutorial.html';

  return <>
    {!isVibeCody && <h1>Welcome to {config.appName}</h1>}
    {isVibeCody && <h1>Welcome on vibe-cody.ai</h1>}
    <p><Flash sx={{color: '#f5e339'}} />This application is powered by <Link href="https://github.com/proophboard/cody-engine">Cody Engine</Link><Flash sx={{color: '#f5e339'}} /></p>
    <Box sx={{marginTop: '30px', maxWidth: '1000px'}}>
      <p>
        {playName} is a <strong>browser-only "vibe coding" app</strong>. Design software using natural language.
      </p>
      <List>
        <ListItem>
          <ListItemIcon><MdiIcon icon="arrow-decision" /></ListItemIcon>
          <ListItemText>Design and validate information flows for high quality data</ListItemText>
        </ListItem>
        <ListItem>
          <ListItemIcon><MdiIcon icon="cogs" /></ListItemIcon>
          <ListItemText>Implement business process automation to speed up repeating work</ListItemText>
        </ListItem>
        <ListItem>
          <ListItemIcon><MdiIcon icon="monitor-dashboard" /></ListItemIcon>
          <ListItemText>Build task-based UIs with a great user experience</ListItemText>
        </ListItem>
      </List>
      <Alert severity="info"
             icon={<AccountSchool />}
             title="Go to tutorial"
             action={<IconButton size="small" component={Link} href={tutorialLink}><OpenInNew /></IconButton>}
      >
        New to {playName}? We've prepared a tutorial to teach you the basics.
      </Alert>
      <Alert variant="outlined" severity="info" icon={<Lightbulb sx={{color: '#f5e339'}} />} sx={{marginTop: theme => theme.spacing(2)}}>
        <i>It's possible to turn the prototype into a production-ready application by installing <Link href="https://github.com/proophboard/cody-engine">Cody Engine</Link> locally and connecting it to a real database (Postgres) and an authentication server like Keycloak.
          Please contact the <Link href="https://prooph-software.de/#board">prooph board team</Link> for more information.
          <br /><br />
          Data and configuration can be saved in <Link href="https://wiki.prooph-board.com/cody_play/playshots.html">Playshots</Link>
        </i>
      </Alert>
      <Divider sx={{marginTop: theme => theme.spacing(4)}}><Typography variant="h3">Personas</Typography></Divider>
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
      <Divider sx={{marginTop: theme => theme.spacing(4)}}><Typography variant="h3">Playshot Import</Typography></Divider>
      {isVibeCody && <Box sx={{marginTop: theme => theme.spacing(4)}}><FileDropzone onFileImport={handleFileImport} /></Box>}
    </Box>
    <PlayPersonaModal open={personaModalOpen} onClose={() => setPersonaModalOpen(false)} />
  </>
};

export default PlayWelcome;
