import {MultiModelStore} from "@event-engine/infrastructure/MultiModelStore";
import {DB} from "@event-engine/infrastructure/Postgres/DB";
import {PostgresEventStore} from "@event-engine/infrastructure/EventStore/PostgresEventStore";
import {PostgresDocumentStore} from "@event-engine/infrastructure/DocumentStore/PostgresDocumentStore";
import {Session} from "@event-engine/infrastructure/MultiModelStore/Session";
import {MetadataMatcher} from "@event-engine/infrastructure/EventStore";
import {Event, EventMeta} from "@event-engine/messaging/event";
import {QueryResult} from "pg";
import {PostgresQueryBuilder} from "@event-engine/infrastructure/DocumentStore/Postgres/PostgresQueryBuilder";
import {PostgresFilterProcessor} from "@event-engine/infrastructure/DocumentStore/Postgres/PostgresFilterProcessor";
import {PostgresIndexProcessor} from "@event-engine/infrastructure/DocumentStore/Postgres/PostgresIndexProcessor";
import {Payload} from "@event-engine/messaging/message";

type Query = [string, any[]];

export class PostgresMultiModelStore implements MultiModelStore {
  private db: DB;
  private eventStore: PostgresEventStore;
  private documentStore: PostgresDocumentStore;
  private queryBuilder: PostgresQueryBuilder;


  constructor(db: DB, eventStore: PostgresEventStore, documentStore: PostgresDocumentStore) {
    this.db = db;
    this.eventStore = eventStore;
    this.documentStore = documentStore;
    this.queryBuilder = new PostgresQueryBuilder(
      new PostgresFilterProcessor(),
      new PostgresIndexProcessor()
    )
  }

  beginSession(): Session {
    return new Session();
  }

  async commitSession(session: Session): Promise<boolean> {
    session.commit();


    const queries: Query[] = [];

    session.getAppendEventsTasks().forEach(task => {
      const [query, bindings] = this.eventStore.makeAppendToQuery(
        task.streamName,
        task.events
      );

      if(query) {
        queries.push([query, bindings]);
      }
    });

    session.getDeleteEventsTasks().forEach(task => {
      queries.push(this.eventStore.makeDeleteFromQuery(task.streamName, task.metadataMatcher));
    })

    session.getUpsertDocumentTasks().forEach(task => queries.push(this.queryBuilder.makeUpsertDocQuery(
      task.collectionName,
      task.docId,
      task.doc
    )));

    session.getDeleteDocumentTasks().forEach(task => queries.push(this.queryBuilder.makeDeleteDocQuery(
      task.collectionName,
      task.docId)));

    await this.db.transaction(function* (): Generator<Query, void, QueryResult> {
      for (const query of queries) {
        yield query;
      }
    });

    session.getAppendEventsTasks().forEach(task => {
      this.eventStore.triggerAppendToListeners(task.streamName, task.events);
    })

    return true;
  }

  loadDoc<D extends object>(collectionName: string, docId: string): Promise<{doc: D, version: number} | null> {
    // @TODO: getDocAndVersion
    return this.documentStore.getDoc(collectionName, docId);
  }

  loadEvents<P extends Payload = any, M extends EventMeta = any>(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number): Promise<AsyncIterable<Event<P, M>>> {
    return this.eventStore.load(streamName, metadataMatcher, fromEventId, limit);
  }
}
