import express, { ErrorRequestHandler, json } from 'express';
import { getConfiguredMessageBox } from '@server/infrastructure/configuredMessageBox';
import { names } from '@event-engine/messaging/helpers';
import { ValidationError } from 'ajv';
import { NotFoundError } from '@event-engine/messaging/error/not-found-error';
import { determineQueryPayload } from '@app/shared/utils/determine-query-payload';
import { extractMetadataFromHeaders } from '@server/infrastructure/extractMetadataFromHeaders';
import {
  CE_USER_HEADER,
  ensureCEUserIsNotSetInProductionMode,
} from '@server/infrastructure/ensureCEUserIsNotSetInProductionMode';
import {getExternalService, getExternalServiceOrThrow} from '@server/extensions/get-external-service';
import { AuthService } from '@event-engine/infrastructure/auth-service/auth-service';
import { expressjwt } from 'express-jwt';
import { env } from '@server/environments/environment.current';
import * as util from 'node:util';
import { ensureCEUServerCommandIsNotSet } from '@server/infrastructure/ensureCEServerCommandIsNotSet';
import { extractMetadataFromQueryParameters } from '@server/infrastructure/extractMetadataFromQueryParameters';
import { runner as pgMigrationRunner } from 'node-pg-migrate';
import { RunnerOption } from 'node-pg-migrate';
import {
  checkInternetConnection,
  checkPostgresConnection,
} from '@server/infrastructure/health';
import { FileUploadService } from '@event-engine/infrastructure/file-upload-service/file-upload-service';
import { schedulerFactory } from '@server/infrastructure/scheduler/scheduler-factory';
import { TimeHasPassedEventSchedule } from '@event-engine/infrastructure/scheduler/scheduler';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 4100;

const app = express();
const messageBox = getConfiguredMessageBox();
const authService = getExternalServiceOrThrow<AuthService>('AuthService', {});
const fileUploadService = getExternalService<FileUploadService>(
  'FileUploadService',
  {}
);

app.use(json({ limit: '20mb' }));
app.use(ensureCEUserIsNotSetInProductionMode);
app.use(ensureCEUServerCommandIsNotSet);
app.set('query parser', 'extended');

if (!env.authentication?.disabled) {
  app.use(
    expressjwt({
      secret: env.keycloak.publicKey,
      issuer: env.keycloak.issuer,
      algorithms: ['RS256'],
      getToken: (request) => {
        if (
          request.headers.authorization &&
          request.headers.authorization.split(' ')[0] === 'Bearer'
        ) {
          return request.headers.authorization.split(' ')[1];
        } else if (request.query && request.query.token) {
          return request.query.token as string;
        }
        return undefined;
      },
    }).unless({ path: ['/api/bitexpert/monitoring/health'] })
  );

  app.use((req, res, next) => {
    if (req.url === '/api/cody-engine/monitoring/health') {
      next();

      return;
    }

    req.headers[CE_USER_HEADER] = (req as any).auth.sub;
    next();
  });
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(400).send({
      message: 'Validation failed',
      errors: err.errors,
    });
  } else if (err instanceof NotFoundError) {
    res.status(404).send({
      message: err.message,
    });
  } else {
    if (err.message === 'AUTH_EMAIL_EXISTS') {
      res.status(409).send({
        message: err.message,
      });
      return;
    } else if (err.message === 'AUTH_UNAUTHORIZED') {
      res.status(401).send({
        message: err.message,
      });
      return;
    }
    console.error(util.inspect(err));
    res.status(500).send({ message: 'Internal server error' });
  }
};

app.post('/api/:module/messages/:name', async (req, res) => {
  const module = names(req.params.module).className;
  const messageName = names(req.params.name).className;
  const fqcn = `${module}.${messageName}`;

  if (messageBox.isCommand(fqcn)) {
    const cmdInfo = messageBox.getCommandInfo(fqcn);
    const cmd = cmdInfo.factory(
      req.body,
      await extractMetadataFromHeaders(req, authService)
    );
    const success = await messageBox.commandBus.dispatch(cmd, cmdInfo.desc);
    res.json({ success });
    return;
  }

  if (messageBox.isEvent(fqcn)) {
    const evtInfo = messageBox.getEventInfo(fqcn);
    const evt = evtInfo.factory(
      req.body,
      await extractMetadataFromHeaders(req, authService)
    );
    const success = await messageBox.eventBus.on(evt);
    res.json({ success });
    return;
  }

  throw new Error(`Unknown message received: "${fqcn}"`);
});

app.post('/api/:module/messages/:aggregate/:name', async (req, res) => {
  const module = names(req.params.module).className;
  const aggregate = names(req.params.aggregate).className;
  const messageName = names(req.params.name).className;
  const fqcn = `${module}.${aggregate}.${messageName}`;

  if (messageBox.isEvent(fqcn)) {
    const evtInfo = messageBox.getEventInfo(fqcn);
    const evt = evtInfo.factory(
      req.body,
      await extractMetadataFromHeaders(req, authService)
    );
    const success = await messageBox.eventBus.on(evt);
    res.json({ success });
    return;
  }

  throw new Error(`Unknown message received: "${fqcn}"`);
});

app.get('/api/:module/messages/:name', async (req, res) => {
  const module = names(req.params.module).className;
  const messageName = names(req.params.name).className;
  const fqcn = `${module}.${messageName}`;

  if (!messageBox.isQuery(fqcn)) {
    throw new Error(`Unknown message received: "${fqcn}"`);
  }

  const metaFromHeaders = await extractMetadataFromHeaders(req, authService);
  const metaFromQuery = await extractMetadataFromQueryParameters(req);

  const queryInfo = messageBox.getQueryInfo(fqcn);
  const query = queryInfo.factory(determineQueryPayload(req.query, queryInfo), {
    ...metaFromHeaders,
    ...metaFromQuery,
  });

  res.json(await messageBox.queryBus.dispatch(query, queryInfo.desc));
});

if(fileUploadService) {
  app.get('/api/:action/presignedUrl/:objectKey', async (req, res) => {
    const action = req.params.action;
    const objectKey = req.params.objectKey;
    const meta = await extractMetadataFromHeaders(req, authService);
    if (!meta['user']) {
      throw new Error('Authentication required');
    }

    const presignedUrl = await (async function () {
      switch (action) {
        case 'upload':
          return await fileUploadService.getUploadUrl({
            key: objectKey,
            user: meta['user'],
          });
        case 'download':
          return await fileUploadService.getFileUrl({
            key: objectKey,
            user: meta['user'],
          });
        default:
          throw new Error(`Action ${action} is not supported`);
      }
    })();

    res.json({ presignedUrl: presignedUrl });
  });
}

app.get('/api/cody-engine/monitoring/health', async (req, res) => {
  if ((await checkPostgresConnection()) && (await checkInternetConnection())) {
    res.status(200).send('OK');
    return;
  }

  res.status(500).send('Internal Server Error');
});

app.use(errorHandler);

const scheduler = env.scheduler ? schedulerFactory(env.production) : undefined;
const eventSchedule: TimeHasPassedEventSchedule = [];

if (env.production) {
  const pgMigrationOptions: RunnerOption = {
    databaseUrl: `postgres://${env.postgres.user}:${env.postgres.password}@${env.postgres.host}:${env.postgres.port}/${env.postgres.database}?ssl=${env.postgres.ssl}`,
    dir: '/app/be/packages/be/src/migrations',
    direction: 'up',
    migrationsTable: 'pgmigrations',
    createMigrationsSchema: false,
    checkOrder: false,
  };

  pgMigrationRunner(pgMigrationOptions).then(() => {
    console.log('[migrations] All migrations executed');
    const server = app.listen(port, host, async () => {
      if(scheduler) {
        scheduler.start(eventSchedule);
      }

      console.log(`[ ready ] http://${host}:${port}`);
    });
  });
} else {
  app.listen(port, host, async () => {
    if(scheduler) {
      scheduler.start(eventSchedule);
    }

    console.log(`[ ready ] http://${host}:${port}`);
  });
}
