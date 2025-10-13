import { env } from '@server/environments/environment.current';
import { runner as pgMigrationRunner } from 'node-pg-migrate';
import { RunnerOption } from 'node-pg-migrate';

const pgMigrationOptions: RunnerOption = {
  databaseUrl: `postgres://${env.postgres.user}:${env.postgres.password}@${env.postgres.host}:${env.postgres.port}/${env.postgres.database}`,
  dir: 'src/migrations',
  direction: 'up',
  migrationsTable: 'pgmigrations',
  createMigrationsSchema: false,
  checkOrder: false,
};

pgMigrationRunner(pgMigrationOptions).then(() => {
  console.log('[migrations] All migrations executed');
});
