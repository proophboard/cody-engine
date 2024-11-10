import {AuthService} from "@event-engine/infrastructure/auth-service/auth-service";
import {env} from "@server/environments/environment.current";
import {PrototypeAuthService} from "@server/infrastructure/auth-service/prototype-auth-service";
import {Personas} from "@app/shared/extensions/personas";

let authService: AuthService;

export const authServiceFactory = (): AuthService => {
  if(authService) {
    return authService;
  }

  if(env.mode === 'prototype') {
    authService = new PrototypeAuthService(Personas, __dirname + '/../../../../shared/src/lib/extensions/personas.ts');

    return authService;
  }

  throw new Error(`Production mode auth service is not implemented`);
}
