import {EventStore} from "@event-engine/infrastructure/EventStore";
import {PostgresEventStore} from "@event-engine/infrastructure/EventStore/PostgresEventStore";
import {getConfiguredDB} from "@server/infrastructure/configuredDB";
import {InMemoryEventStore} from "@event-engine/infrastructure/EventStore/InMemoryEventStore";
import {InMemoryStreamListenerQueue} from "@event-engine/infrastructure/Queue/InMemoryStreamListenerQueue";
import {EventDispatcher} from "@event-engine/infrastructure/EventDispatcher";
import {env} from "@server/environments/environment.current";

export const WRITE_MODEL_STREAM = 'write_model_stream';
export const PUBLIC_STREAM = 'public_stream';

export const PERSISTENT_STREAMS_FILE = process.cwd() + '/data/persistent-streams.json';

let es: EventStore;

export const getConfiguredEventStore = (): EventStore => {
  if(!es) {
    switch (env.eventStore.adapter) {
      case "postgres":
        es = new PostgresEventStore(getConfiguredDB());
        break;
      case "filesystem":
        es = new InMemoryEventStore(PERSISTENT_STREAMS_FILE);
        break;
      default:
        es = new InMemoryEventStore();
    }

    // Avoid circular deps in listeners
    const streamListener = new InMemoryStreamListenerQueue(es, PUBLIC_STREAM);

    streamListener.startProcessing();
  }

  return es;
}
