import Keycloak from 'keycloak-js';
import {environment} from "@frontend/environments/environment";

const keycloakConfig = {
  url: environment.keycloak.baseUrl,
  realm: environment.keycloak.realm,
  clientId: environment.keycloak.clientId
};
let keycloak: Keycloak;

export const getConfiguredKeycloak = (): Keycloak => {
  if(!keycloak) {
    keycloak = new Keycloak(keycloakConfig);
  }

  return keycloak;
}
