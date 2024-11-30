import Keycloak from 'keycloak-js';
import {environment} from "@frontend/environments/environment";

const keycloakConfig = {
  url: environment.keycloak.baseUrl,
  realm: environment.keycloak.realm,
  clientId: environment.keycloak.clientId
};
let keycloak: Keycloak;

export const getConfiguredKeycloak = (): Keycloak => {
  // Workaround for Cody to avoid that Keycloak gets initialized during code generation
  if(!keycloak && typeof window !== "undefined") {
    keycloak = new Keycloak(keycloakConfig);
  }

  return keycloak;
}
