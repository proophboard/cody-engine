import {EventStore} from "@event-engine/infrastructure/EventStore";
import {PostgresEventStore} from "@event-engine/infrastructure/EventStore/PostgresEventStore";
import {getConfiguredDB} from "@server/infrastructure/configuredDB";
import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {InMemoryStreamListenerQueue} from "@event-engine/infrastructure/Queue/InMemoryStreamListenerQueue";
import {env} from "@server/environments/environment.current";
import {EventQueue} from "@event-engine/infrastructure/EventQueue";
import {getExternalService, getExternalServiceOrThrow} from "@server/extensions/get-external-service";
import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {NodeFilesystem} from "@event-engine/infrastructure/helpers/node-file-system";
import {mapMetadataFromEventStore} from "@event-engine/infrastructure/EventStore/map-metadata-from-event-store";
import {AuthService, SERVICE_NAME_AUTH_SERVICE} from "@server/infrastructure/auth-service/auth-service";

export const WRITE_MODEL_STREAM = 'write_model_stream';
export const PUBLIC_STREAM = 'public_stream';
export const SERVICE_NAME_WRITE_MODEL_STREAM_LISTENER_QUEUE = '$write_model_steam_listener_queue';
export const SERVICE_NAME_PUBLIC_STREAM_LISTENER_QUEUE = '$public_stream_listener_queue';
export const SERVICE_OPTION_EVENT_STORE = 'eventStore';

const path = process.cwd() === '/app' ? '/data' : '/../../data';

export const PERSISTENT_STREAMS_FILE = process.cwd() + path + '/persistent-streams.json';

let es: EventStore;

export const getConfiguredEventStore = (): EventStore => {
  if(!es) {
    switch (env.eventStore.adapter) {
      case "postgres":
        es = new PostgresEventStore(getConfiguredDB());
        break;
      case "filesystem":
        es = new InMemoryEventStore(new NodeFilesystem(), PERSISTENT_STREAMS_FILE);
        break;
      default:
        es = new InMemoryEventStore(new NodeFilesystem());
    }

    const authService = getExternalServiceOrThrow<AuthService>(SERVICE_NAME_AUTH_SERVICE, {});

    // Avoid circular deps in listeners
    const publicStreamListener = getExternalService<EventQueue>(SERVICE_NAME_PUBLIC_STREAM_LISTENER_QUEUE, {eventStore: es})
      || makeDefaultStreamListener(es, PUBLIC_STREAM, authService);

    publicStreamListener.startProcessing();

    const writeModelStreamListener = getExternalService<EventQueue>(SERVICE_NAME_WRITE_MODEL_STREAM_LISTENER_QUEUE, {eventStore: es})
      || makeDefaultStreamListener(es, WRITE_MODEL_STREAM, authService);

    writeModelStreamListener.startProcessing();
  }

  return es;
}

const makeDefaultStreamListener = (es: EventStore, stream: string, authService: AuthService): EventQueue => {
  const streamListener = new InMemoryStreamListenerQueue(es, stream);

  streamListener.attachConsumer(async (event) => {
    event = (await mapMetadataFromEventStore([event], authService))[0];
    return getConfiguredMessageBox().eventBus.on(event);
  })

  return streamListener;
}
