import {PoolConfig} from "pg";
import {CodyEngineMode} from "@app/shared/types/core/cody/cody-engine-mode";

export interface Environment {
  production: boolean;
  mode: CodyEngineMode;
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
