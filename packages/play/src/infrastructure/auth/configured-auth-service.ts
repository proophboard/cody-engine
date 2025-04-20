import {Persona} from "@app/shared/extensions/personas";
import { OnPersonaAdded, OnPersonaUpdated, PlayAuthService } from '@cody-play/infrastructure/auth/play-auth-service';
import { PlayAddPersona, PlayUpdatePersona } from '@cody-play/state/types';
import {ElementEditedContext} from "@cody-play/infrastructure/cody/cody-message-server";

let service: PlayAuthService;

export const getConfiguredPlayAuthService = (
  ctx?: ElementEditedContext,
  personas?: Persona[],
  onPersonaDispatch?: (action: {ctx: ElementEditedContext} & (PlayAddPersona|PlayUpdatePersona)) => void,
): PlayAuthService => {
  if(!onPersonaDispatch) {
    onPersonaDispatch = () => { /* Do nothing*/ };
  }

  if(!service || personas) {
    const onPersonaAdded: OnPersonaAdded = ctx ? (newPersona) => {
      onPersonaDispatch!({
        type: "ADD_PERSONA",
        persona: newPersona,
        ctx
      })
    }
    : (newPersona) => { /* Do nothing*/ }

    const onPersonaUpdated: OnPersonaUpdated = ctx ? (updatedPersona) => {
      onPersonaDispatch!({
        type: "UPDATE_PERSONA",
        persona: updatedPersona,
        ctx
      })
    } : (updatdPersona) => { /* Do nothing*/ }

    service = new PlayAuthService(personas || [], onPersonaAdded, onPersonaUpdated);
  }

  return service;
}
