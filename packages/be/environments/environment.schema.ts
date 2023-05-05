import {PoolConfig} from "pg";

export interface Environment {
  production: boolean;
  postgres: PoolConfig;
  keycloak: {baseUrl: string, realm: string};
  eventStore: {
    adapter: "postgres" | "memory" | "filesystem"
  },
  documentStore: {
    adapter: "postgres" | "memory" | "filesystem"
  },
  authentication?: {
    disabled: boolean;
  }
}
