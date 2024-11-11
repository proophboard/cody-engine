import {Environment} from "./environment.schema";

export const env: Environment = {
  production: true,
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
    host: process.env.CORE_DB_HOST || '',
    port: parseInt(process.env.CORE_DB_PORT || '5432'),
    database: process.env.CORE_DB_NAME || '',
    user: process.env.CORE_DB_USER || '',
    password: process.env.CORE_DB_PWD || '',
    ssl: true,
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
