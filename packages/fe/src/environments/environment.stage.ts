import {CodyEngineMode} from "@app/shared/types/core/cody/cody-engine-mode";

export const environment = {
  production: true,
  appName: 'Cody Engine',
  mode: 'production-stack' as CodyEngineMode,
  defaultService: 'App',
  keycloak: {
    baseUrl: 'https://auth.cody.local/auth',
    realm: 'App',
    clientId: 'app-fe',
    /*
     * Keycloak REST API does not include roles in user representations, you have to fetch them separately which potentially results in many requests
     * To work around the issue, you can configure roles as user attributes and tell the Keycloak client to use the roles from attributes instead
     */
    useAttributeRoles: true,
  },
};
