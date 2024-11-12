// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

import {Environment} from "./environment.schema";

export const env: Environment = {
  production: false,
  mode: "production-stack",
  keycloak: {
    baseUrl: process.env.KC_BASE_URL || 'http://keycloak:8080/auth',
    realm: process.env.KC_REALM || '',
    clientId: process.env.KC_CLIENT_ID || '',
    issuer: `${process.env.KC_BASE_URL}/realms/${process.env.KC_REALM}`,
    publicKey: [
      '-----BEGIN PUBLIC KEY-----',
      process.env.KC_PUBLIC_KEY,
      '-----END PUBLIC KEY-----',
    ].join('\n'),
    useAttributeRoles: true,
    admin: {
      username: process.env.KC_ADMIN_USERNAME || '',
      password: process.env.KC_ADMIN_PASSWORD || '',
      clientId: process.env.KC_ADMIN_CLIENT_ID || 'admin-cli',
    }
  },
  postgres: {
    host: process.env.APP_DB_HOST || 'localhost',
    port: parseInt(process.env.APP_DB_PORT || '5432'),
    database: process.env.APP_DB_NAME || 'app',
    user: process.env.APP_DB_USER || 'dbadmin',
    password: process.env.APP_DB_PWD || 'password',
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
