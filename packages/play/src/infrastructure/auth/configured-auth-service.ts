import {Persona} from "@app/shared/extensions/personas";
import {OnPersonaAdded, PlayAuthService} from "@cody-play/infrastructure/auth/play-auth-service";
import {PlayAddPersona, PlaySetPersonas} from "@cody-play/state/types";

let service: PlayAuthService;

export const getConfiguredPlayAuthService = (personas?: Persona[], onPersonaAddedDispatch?: (action: PlayAddPersona) => void): PlayAuthService => {
  if(!onPersonaAddedDispatch) {
    onPersonaAddedDispatch = () => { /* Do nothing*/ };
  }

  const onPersonaAdded: OnPersonaAdded = (newPersona) => {
    onPersonaAddedDispatch!({
      type: "ADD_PERSONA",
      persona: newPersona
    })
  }

  if(!service || personas) {
    service = new PlayAuthService(personas || [], onPersonaAdded);
  }

  return service;
}
