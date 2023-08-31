import {AuthService} from "@server/infrastructure/auth-service/auth-service";
import {env} from "@server/environments/environment.current";
import {PrototypeAuthService} from "@server/infrastructure/auth-service/prototype-auth-service";
import {FsTree} from "nx/src/generators/tree";
import {Personas} from "@app/shared/extensions/personas";

let authService: AuthService;

export const authServiceFactory = (): AuthService => {
  if(authService) {
    return authService;
  }

  if(env.mode === 'prototype') {
    const tree = new FsTree(__dirname + '/../../../../shared/src/lib/extensions', true);
    authService = new PrototypeAuthService(Personas, tree);

    return authService;
  }

  throw new Error(`Production mode auth service is not implemented`);
}
