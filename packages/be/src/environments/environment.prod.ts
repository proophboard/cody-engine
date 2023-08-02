import {Environment} from "./environment.schema";

export const env: Environment = {
  production: true,
  mode: "prototype",
  keycloak: {
    baseUrl: 'http://localhost:8080',
    realm: 'app'
  },
  //@TODO: Inject via env
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'app',
    user: 'dev',
    password: 'dev',
    max: 200
  },
  eventStore: {
    adapter: "postgres"
  },
  documentStore: {
    adapter: "postgres"
  },
  authentication: {
    disabled: false
  }
};
