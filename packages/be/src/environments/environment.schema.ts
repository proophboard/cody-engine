import {PoolConfig} from "pg";
import {CodyEngineMode} from "@app/shared/types/core/cody/cody-engine-mode";

export interface Environment {
  production: boolean;
  mode: CodyEngineMode;
  postgres: PoolConfig;
  keycloak: {
    baseUrl: string,
    realm: string,
    clientId: string,
    issuer: string,
    publicKey: string;
    /*
     * Keycloak REST API does not include roles in user representations, you have to fetch them separately which potentially results in many requests
     * To work around the issue, you can configure roles as user attributes and tell the Keycloak client to use the roles from attributes instead
     */
    useAttributeRoles?: true;
    admin: {
      username: string,
      password: string,
      clientId: string,
    }
  };
  eventStore: {
    adapter: "postgres" | "memory" | "filesystem"
  };
  documentStore: {
    adapter: "postgres" | "memory" | "filesystem"
  };
  authentication?: {
    disabled: boolean;
  }
}
