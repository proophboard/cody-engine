// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

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
    adapter: "filesystem"
  },
  documentStore: {
    adapter: "filesystem"
  },
  authentication: {
    disabled: true
  }
};
