import * as React from 'react';
import {Persona, PERSONA_STORAGE_KEY} from "@app/shared/extensions/personas";
import {Box, Button, Card, CardActions, CardContent, Typography} from "@mui/material";
import UserAvatar from "@frontend/app/components/core/UserAvatar";
import Grid2 from "@mui/material/Unstable_Grid2";
import {useUser} from "@frontend/hooks/use-user";
import {Login} from "mdi-material-ui";

interface OwnProps {
  persona: Persona;
}

type PersonaCardProps = OwnProps;

const PersonaCard = (props: PersonaCardProps) => {
  const {persona} = props;
  const [currentUser, setCurrentUser] = useUser();

  const handleSignIn = () => {
    setCurrentUser(persona);
    sessionStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(persona));
  }

  return <Grid2 xs={12} sm={6} md={4}>
    <Card sx={{height: '100%'}}>
      <CardContent>
        <Typography variant="h5" gutterBottom={true}>{persona.displayName}</Typography>
        <Box component="div" sx={{display: 'inline-block', paddingRight: "20px", paddingBottom: "20px", float: "left"}}>
          <UserAvatar user={persona} color={persona.color} sx={{width: "100px", height: "100px"}} badgeOverlap="circular" showBadge={currentUser.userId === persona.userId} />
        </Box>
        <Typography component="span" sx={{display: "inline", whiteSpace: 'pre-line'}}>{persona.description}</Typography>
      </CardContent>
      <CardActions>
        <Button startIcon={<Login />} variant="text" disabled={currentUser.userId === persona.userId} onClick={handleSignIn}>Sign In</Button>
      </CardActions>
    </Card>
  </Grid2>
};

export default PersonaCard;
