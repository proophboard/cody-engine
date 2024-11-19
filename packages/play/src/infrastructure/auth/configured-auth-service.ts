import {Persona} from "@app/shared/extensions/personas";
import { OnPersonaAdded, OnPersonaUpdated, PlayAuthService } from '@cody-play/infrastructure/auth/play-auth-service';
import { PlayAddPersona, PlayUpdatePersona } from '@cody-play/state/types';

let service: PlayAuthService;

export const getConfiguredPlayAuthService = (
  personas?: Persona[],
  onPersonaDispatch?: (action: PlayAddPersona|PlayUpdatePersona) => void,
): PlayAuthService => {
  if(!onPersonaDispatch) {
    onPersonaDispatch = () => { /* Do nothing*/ };
  }

  const onPersonaAdded: OnPersonaAdded = (newPersona) => {
    onPersonaDispatch!({
      type: "ADD_PERSONA",
      persona: newPersona
    })
  }

  const onPersonaUpdated: OnPersonaUpdated = (updatedPersona) => {
    onPersonaDispatch!({
      type: "UPDATE_PERSONA",
      persona: updatedPersona
    })
  }

  if(!service || personas) {
    service = new PlayAuthService(personas || [], onPersonaAdded, onPersonaUpdated);
  }

  return service;
}
