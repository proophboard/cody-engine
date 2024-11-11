#!/bin/bash
set -e

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER keycloak with encrypted password 'password';
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
EOSQL
