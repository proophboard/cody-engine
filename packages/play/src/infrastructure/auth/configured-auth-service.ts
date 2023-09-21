import {Persona} from "@app/shared/extensions/personas";
import {PlayAuthService} from "@cody-play/infrastructure/auth/play-auth-service";

let service: PlayAuthService;

export const getConfiguredPlayAuthService = (personas?: Persona[]): PlayAuthService => {
  if(!service || personas) {
    service = new PlayAuthService(personas || []);
  }

  return service;
}
