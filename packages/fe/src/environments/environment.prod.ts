import {CodyEngineMode} from "@app/shared/types/core/cody/cody-engine-mode";
import {LayoutType} from "@frontend/app/layout/layout-type";

export const environment = {
  production: true,
  appName: 'Cody',
  mode: 'production-stack' as CodyEngineMode,
  layout: 'task-based-ui' as LayoutType,
  /*
   * Default Service prefix used to resolve relative command, event, and information names
   * The default service should match with the one defined in the Cody config, see: packages/cody/codyconfig.ts
   */
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
