/* eslint-disable no-prototype-builtins */
import {Event, EventMeta} from "@event-engine/messaging/event";
import {
  AppendToListener, checkMatchObject,
  EventStore,
  MatchOperator,
  MetadataMatcher, StreamType
} from "@event-engine/infrastructure/EventStore";
import {messageFromJSON, Payload} from "@event-engine/messaging/message";
import {Filesystem, NodeFilesystem} from "@event-engine/infrastructure/helpers/fs";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {ConcurrencyError} from "@event-engine/infrastructure/EventStore/ConcurrencyError";

export interface InMemoryStreamStore {
  [streamName: string]: Event[];
}



const matchMetadata = (event: Event, metadataMatcher: MetadataMatcher): boolean => {
  const meta = {...event.meta};

  for(const prop in metadataMatcher) {
    if(metadataMatcher.hasOwnProperty(prop)) {
      if(prop === '$eventId') {
        meta['$eventId'] = event.uuid;
      }

      if(!meta.hasOwnProperty(prop)) {
        return false;
      }

      const matchObject = checkMatchObject(metadataMatcher[prop]);

      switch (matchObject.op) {
        case MatchOperator.EQ:
          if (meta[prop] !== matchObject.val) return false;
          break;
        case MatchOperator.GT:
          if (meta[prop] <= matchObject.val) return false;
          break;
        case MatchOperator.GTE:
          if (meta[prop] < matchObject.val) return false;
          break;
        case MatchOperator.LT:
          if (meta[prop] >= matchObject.val) return false;
          break;
        case MatchOperator.LTE:
          if (meta[prop] > matchObject.val) return false;
          break;
      }

    }
  }

  return true;
}

export class InMemoryEventStore implements EventStore {
  private streams: InMemoryStreamStore = {};
  private persistOnDisk: boolean;
  private publishOnFlush: boolean = false;
  private readonly storageFile: string;
  private appendToListeners: AppendToListener[] = [];
  private readonly fs: Filesystem;
  private session: {streamName: string, events: Event[]} | undefined;

  constructor(storageFile?: string, fs?: Filesystem) {
    this.persistOnDisk = !!storageFile;
    this.storageFile = storageFile || '//memory';
    this.fs = fs || new NodeFilesystem();

    if(this.persistOnDisk) {
      if(!this.fs.existsSync(this.storageFile)) {
        this.fs.writeFileSync(this.storageFile, JSON.stringify({streams: this.streams}));
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.streams = require(this.storageFile).streams;
    }
  }

  public async hasStream(streamName: string): Promise<boolean> {
    return this.streams.hasOwnProperty(streamName);
  }

  public async createStream(streamName: string, type?: StreamType): Promise<boolean> {
    if(! await this.hasStream(streamName)) {
      this.streams[streamName] = [];

      this.persistOnDiskIfEnabled();
    }

    return true;
  }

  public async deleteStream(streamName: string): Promise<boolean> {
    if(await this.hasStream(streamName)) {
      delete this.streams[streamName];

      this.persistOnDiskIfEnabled();
    }

    return true;
  }

  public async appendTo(streamName: string, events: Event[], metadataMatcher?: MetadataMatcher, expectedVersion?: number): Promise<boolean> {
    if(!this.streams.hasOwnProperty(streamName)) {
      this.streams[streamName] = [];
    }

    if(metadataMatcher && typeof expectedVersion !== 'undefined') {
      const existingEvtsItr =  await this.load(streamName, metadataMatcher);
      const existingEvts = [];

      for await (const existingEvt of existingEvtsItr) {
        existingEvts.push(existingEvt);
      }


      if(existingEvts.length !== expectedVersion) {
        throw new ConcurrencyError(`Concurrency exception. Expected stream version does not match. Expected ${expectedVersion} for stream ${streamName} with metadata matcher ${JSON.stringify(metadataMatcher)}. But current version is ${existingEvts.length}`);
      }
    }

    this.streams[streamName].push(...events);

    this.persistOnDiskIfEnabled();

    if(this.publishOnFlush) {
        this.session = {streamName, events};
    } else {
      this.appendToListeners.forEach(l => l(streamName, events));
    }

    return true;
  }

  public async load<P extends Payload = any, M extends EventMeta= any>(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number): Promise<AsyncIterable<Event<P,M>>> {
    return new Promise<AsyncIterable<Event>>(resolve => {

      if(!this.streams.hasOwnProperty(streamName)) {
        throw Error(`Stream "${ streamName }" not found`);
      }

      let events = this.streams[streamName].filter(evt => matchMetadata(evt, metadataMatcher || {}));

      if(typeof fromEventId !== 'undefined') {
        let eventIdMatched = false;
        events = events.filter(evt => {
          if(eventIdMatched) {
            return true;
          }

          //Switch matched flag but still exclude matched event. Only newer events should be returned by load
          if(evt.uuid === fromEventId) {
            eventIdMatched = true;
          }
          return false;
        })
      }

      const filteredEvents = events.slice(0, limit);

      filteredEvents.map((evt, idx) => {
        filteredEvents[idx] = messageFromJSON(evt);
      })

      const iter = async function *() {
        for (const event of filteredEvents) {
          yield event;
        }
      }

      resolve(iter());
    });
  }

  public delete(streamName: string, metadataMatcher: MetadataMatcher): Promise<number> {
    return new Promise<number>(resolve => {
      if(!this.streams.hasOwnProperty(streamName)) {
        throw Error(`Stream "${ streamName }" not found`);
      }

      const deletedEvents = this.streams[streamName].filter(evt => matchMetadata(evt, metadataMatcher));

      this.streams[streamName] = this.streams[streamName].filter(evt => !matchMetadata(evt, metadataMatcher));

      this.persistOnDiskIfEnabled();

      resolve(deletedEvents.length);
    });
  }

  public disableDiskStorage(): void {
    this.persistOnDisk = false;
    this.publishOnFlush = true;
  }

  public enableDiskStorage(): void {
    this.persistOnDisk = this.storageFile !== '//memory';
    this.publishOnFlush = false;
  }

  public flush(): void {
    this.persistOnDiskIfEnabled();
    if(this.session) {
      const {streamName, events} = this.session;
      this.session = undefined;
      this.appendToListeners.forEach(l => l(streamName, events));
    }
  }

  public attachAppendToListener(listener: AppendToListener): void {
    if(!this.appendToListeners.includes(listener)) {
      this.appendToListeners.push(listener);
    }
  }

  public detachAppendToListener(listener: AppendToListener): void {
    this.appendToListeners = this.appendToListeners.filter(l => l !== listener);
  }

  public async importStreams(streams: InMemoryStreamStore): Promise<void> {
    this.streams = streams;
  }

  public async exportStreams(): Promise<InMemoryStreamStore> {
    return this.streams;
  }

  public syncExportStreams(): InMemoryStreamStore {
    return this.streams;
  }

  public async republish(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number): Promise<void> {
    const events = await this.load(streamName, metadataMatcher, fromEventId, limit);

    for await (const event of events) {
      this.appendToListeners.forEach(l => l(streamName, [event], true));
    }
  }

  private persistOnDiskIfEnabled () {
    if(this.persistOnDisk) {
      this.fs.writeFileSync(this.storageFile, JSON.stringify({streams: this.streams}, null, 2));
    }
  }
}
