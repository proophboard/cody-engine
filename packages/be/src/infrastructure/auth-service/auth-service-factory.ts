import {AuthService} from "@event-engine/infrastructure/auth-service/auth-service";
import {env} from "@server/environments/environment.current";
import {PrototypeAuthService} from "@server/infrastructure/auth-service/prototype-auth-service";
import {Personas} from "@app/shared/extensions/personas";
import {KeycloakAuthService} from "@server/infrastructure/auth-service/keycloak-auth-service";
import { KeycloakAdminClient } from '@s3pweb/keycloak-admin-client-cjs';

let authService: AuthService;

export const authServiceFactory = (): AuthService => {
  if(authService) {
    return authService;
  }

  if(env.mode === 'prototype') {
    authService = new PrototypeAuthService(Personas, __dirname + '/../../../../shared/src/lib/extensions/personas.ts');

    return authService;
  }

  return new KeycloakAuthService(makeKeycloakAdminApiClient(), env.keycloak.admin, env.keycloak.realm, env.keycloak.useAttributeRoles);
}

const makeKeycloakAdminApiClient = (): KeycloakAdminClient => {
  return new KeycloakAdminClient({
    baseUrl: env.keycloak.baseUrl
  });
}
