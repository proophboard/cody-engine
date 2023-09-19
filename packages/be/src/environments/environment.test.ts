import {Environment} from "./environment.schema";

export const env: Environment = {
  production: false,
  mode: "prototype",
  keycloak: {
    baseUrl: 'http://localhost:8080',
    realm: 'app'
  },
  postgres: {
    host: 'localhost',
    port: 5433,
    database: 'test',
    user: 'dev',
    password: 'dev',
    max: 200
  },
  eventStore: {
    adapter: "memory"
  },
  documentStore: {
    adapter: "memory"
  },
  authentication: {
    disabled: true
  }
};
