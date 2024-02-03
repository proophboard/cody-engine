import {
  AppendToListener,
  checkMatchObject,
  EventStore,
  MatchObject, MatchOperator,
  MetadataMatcher, StreamType
} from "@event-engine/infrastructure/EventStore";
import {DB} from "@event-engine/infrastructure/Postgres/DB";
import {Event, EventMeta} from "@event-engine/messaging/event";
import {AggregateMeta} from "@event-engine/infrastructure/AggregateRepository";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {Payload} from "@event-engine/messaging/message";
import {ConcurrencyError} from "@event-engine/infrastructure/EventStore/ConcurrencyError";

interface Row<P,M> {
  no: number;
  uuid: string;
  name: string;
  payload: P;
  meta: M;
  created_at: Date;
}

// @TODO: Handle database schema (public by default)

export class PostgresEventStore implements EventStore {
  private db: DB;
  private appendToListeners: AppendToListener[] = [];

  constructor(db: DB) {
    this.db = db;
  }

  async createStream(streamName: string, type?: StreamType): Promise<boolean> {
    let constraints = ``;

    const isWriteModelStream = !type || type === "write-model";

    if(isWriteModelStream) {
      constraints = `CONSTRAINT aggregate_version_not_null CHECK ((meta->>'${AggregateMeta.VERSION}') IS NOT NULL),
          CONSTRAINT aggregate_type_not_null CHECK ((meta->>'${AggregateMeta.TYPE}') IS NOT NULL),
          CONSTRAINT aggregate_id_not_null CHECK ((meta->>'${AggregateMeta.ID}') IS NOT NULL),
      `;
    }

    await this.db.query(`
        CREATE TABLE ${streamName} (
          no BIGSERIAL,
          uuid UUID NOT NULL,
          name VARCHAR(100) NOT NULL,
          payload JSON NOT NULL,
          meta JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          PRIMARY KEY (no),
          ${constraints}
          UNIQUE (uuid)
      );
    `);

    if(isWriteModelStream) {
      await this.db.query(`
      CREATE UNIQUE INDEX ON ${streamName}
      (
        (meta->>'${AggregateMeta.TYPE}'), (meta->>'${AggregateMeta.ID}'), (meta->>'${AggregateMeta.VERSION}')
      );
    `);

      await this.db.query(`
      CREATE INDEX ON ${streamName}
      (
        (meta->>'${AggregateMeta.TYPE}'), (meta->>'${AggregateMeta.ID}'), no
      );
    `);
    }

    return true;
  }

  async deleteStream(streamName: string): Promise<boolean> {
    await this.db.query(`
      DROP TABLE IF EXISTS ${streamName}
    `);

    return true;
  }

  async hasStream(streamName: string): Promise<boolean> {
    const result = await this.db.query(`
    SELECT EXISTS (
    SELECT FROM 
        information_schema.tables 
    WHERE 
        table_schema LIKE 'public' AND 
        table_type LIKE 'BASE TABLE' AND
        table_name = $1
    );
    `, [streamName]);

    return result.rows[0].exists;
  }

  async appendTo(streamName: string, events: Event[], metadataMatcher?: MetadataMatcher, expectedVersion?: number): Promise<boolean> {
    // Since we have a unique index on aggregate meta, we can ignore metadataMatcher and expectedVersion. It's checked by Postgres on insert

    const [query, bindings] = this.makeAppendToQuery(streamName, events);

    if(!query) {
      return false;
    }

    try {
      await this.db.query(query, bindings);
    } catch (err: any) {
      if(err.code && (err.code == "23505" || err.code == "23000")) {
        throw new ConcurrencyError(`Concurrency exception. Expected stream version does not match. Expected ${expectedVersion} for stream ${streamName} with metadata matcher ${JSON.stringify(metadataMatcher)}.`);
      }

      throw err;
    }

    this.triggerAppendToListeners(streamName, events);

    return true;
  }

  makeAppendToQuery(streamName: string, events: Event[]): [string | null, any[]] {
    if(events.length === 0) {
      return [null, []];
    }

    const bindings: any[] = [];
    let valuesStr = '';

    events.forEach((event, index) => {
      const rowStart = index * 5;
      const isLastEvent = index + 1 === events.length;

      valuesStr += `($${(rowStart + 1)}, $${(rowStart + 2)}, $${(rowStart + 3)}, $${(rowStart + 4)}, $${(rowStart + 5)})`
        + (isLastEvent ? '' : ', ');

      bindings.push(event.uuid);
      bindings.push(event.name);
      bindings.push(event.payload);
      bindings.push(event.meta);
      bindings.push(event.createdAt);
    });


    const query = `
    INSERT INTO ${streamName} (uuid, name, payload, meta, created_at)
    VALUES ${valuesStr};
    `;

    return [query, bindings];
  }

  makeDeleteFromQuery(streamName: string, metadataMatcher: MetadataMatcher): [string, any[]] {
    let valuePos = 1;
    let where = '';
    const bindings = [];
    for(const prop in metadataMatcher) {
      const [matchWhere, value] = this.matchObjectToWhereClause(prop, valuePos, metadataMatcher[prop]);
      where += matchWhere + ' AND ';
      bindings.push(value);
      valuePos++;
    }

    const query = `DELETE FROM ${streamName} WHERE ${where};`;

    return [query, bindings];
  }

  triggerAppendToListeners(streamName: string, events: Event[]): void {
    this.appendToListeners.forEach(l => l(streamName, events));
  }

  async load<P extends Payload = any, M extends EventMeta = any>(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number): Promise<AsyncIterable<Event<P, M>>> {
    let fromEventNo;
    const bindings = [];

    if(fromEventId) {
      const fromEventResult = await this.db.query(`
        SELECT no FROM ${streamName} WHERE uuid = $1;
      `, [fromEventId]);

      if(fromEventResult.rowCount === 1) {
        fromEventNo = fromEventResult.rows[0].no;
      }
    }

    let where = '';

    if(metadataMatcher) {
      let valuePos = 1;
      for(const prop in metadataMatcher) {
        const [matchWhere, value] = this.matchObjectToWhereClause(prop, valuePos, metadataMatcher[prop]);
        where += matchWhere + ' AND ';
        bindings.push(value);
        valuePos++;
      }
      where += fromEventNo? `no > ${fromEventNo}` : '1=1';
    }

    const query = `SELECT * FROM ${streamName} WHERE ${where} ORDER BY no asc ` + (limit? `LIMIT ${limit}` : '') + ';';

    const cursor = await this.db.iterableCursor<Row<P,M>>(query, bindings);

    return asyncMap<Event<P, M>, Row<P,M>>(cursor, (row => ({
      uuid: row.uuid,
      name: row.name,
      payload: row.payload,
      meta: row.meta,
      createdAt: row.created_at
    })));
  }

  async delete(streamName: string, metadataMatcher: MetadataMatcher): Promise<number> {
    const [query, bindings] = this.makeDeleteFromQuery(streamName, metadataMatcher);

    const result = await this.db.query(query, bindings);

    return result.rowCount;
  }

  public async republish(streamName: string, metadataMatcher?: MetadataMatcher, fromEventId?: string, limit?: number): Promise<void> {
    const events = await this.load(streamName, metadataMatcher, fromEventId, limit);

    for await (const event of events) {
      this.appendToListeners.forEach(l => l(streamName, [event]));
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

  public getAppendToListeners(): AppendToListener[] {
    return this.appendToListeners;
  }

  private matchObjectToWhereClause(prop: string, valuePos: number, matcher: MatchObject | string): [string, any] {
    matcher = checkMatchObject(matcher);

    if(prop === '$eventId') {
      return [`uuid = $${valuePos}`, matcher.val];
    }

    switch (matcher.op) {
      case MatchOperator.EQ:
        return [`meta->'${prop}' = $${valuePos}`, JSON.stringify(matcher.val)];
      case MatchOperator.GT:
        return [`meta->'${prop}' > $${valuePos}`, JSON.stringify(matcher.val)];
      case MatchOperator.GTE:
        return [`meta->'${prop}' >= $${valuePos}`, JSON.stringify(matcher.val)];
      case MatchOperator.LT:
        return [`meta->'${prop}' < $${valuePos}`, JSON.stringify(matcher.val)];
      case MatchOperator.LTE:
        return [`meta->'${prop}' <= $${valuePos}`, JSON.stringify(matcher.val)];
    }
  }
}
