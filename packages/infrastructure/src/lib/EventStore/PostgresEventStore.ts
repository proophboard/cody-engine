import {
  AggregateMeta,
  AppendToListener,
  checkMatchObject,
  EventMatcher,
  EventStore,
  MatchObject,
  MatchOperator,
  StreamType
} from "@event-engine/infrastructure/EventStore";
import {DB} from "@event-engine/infrastructure/Postgres/DB";
import {Event, EventMeta} from "@event-engine/messaging/event";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {Payload} from "@event-engine/messaging/message";
import {ConcurrencyError} from "@event-engine/infrastructure/EventStore/ConcurrencyError";
import {AuthService} from "@event-engine/infrastructure/auth-service/auth-service";
import {mapMetadataFromEventStore} from "@event-engine/infrastructure/EventStore/map-metadata-from-event-store";

type Binding = string | object | Date;

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

  async appendTo(streamName: string, events: Event[], eventMatcher?: EventMatcher, expectedVersion?: number, doNotPublish?: boolean): Promise<boolean> {
    // Since we have a unique index on aggregate meta, we can ignore eventMatcher and expectedVersion. It's checked by Postgres on insert

    const [query, bindings] = this.makeAppendToQuery(streamName, events);

    if(!query) {
      return false;
    }

    try {
      await this.db.query(query, bindings);
    } catch (err: any) {
      if(err.code && (err.code == "23505" || err.code == "23000")) {
        throw new ConcurrencyError(`Concurrency exception. Expected stream version does not match. Expected ${expectedVersion} for stream ${streamName} with metadata matcher ${JSON.stringify(eventMatcher)}.`);
      }

      throw err;
    }

    if(doNotPublish) {
      return true;
    }

    this.triggerAppendToListeners(streamName, events);

    return true;
  }

  makeDeleteFromQuery(streamName: string, eventMatcher: EventMatcher): [string, any[]] {
    let valuePos = 1;
    let where = '';
    const bindings = [];
    for(const prop in eventMatcher) {
      const [matchWhere, value] = this.matchObjectToWhereClause(prop, valuePos, eventMatcher[prop]);
      where += (where.length > 0 ? ' AND ' : '') + matchWhere;
      if(Array.isArray(value)) {
        bindings.push(...value);
        valuePos += value.length;
      } else {
        bindings.push(value);
        valuePos++;
      }
    }

    const query = `DELETE FROM ${streamName} WHERE ${where};`;

    return [query, bindings];
  }

  triggerAppendToListeners(streamName: string, events: Event[]): void {
    this.appendToListeners.forEach(l => l(streamName, events));
  }

  makeAppendToQuery(streamName: string, events: Event[]): [string | null, Binding[]] {
    if(events.length === 0) {
      return [null, []];
    }

    const bindings: Binding[] = [];
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

  async load<P extends Payload, M extends EventMeta>(
    streamName: string,
    eventMatcher?: EventMatcher,
    fromEventId?: string,
    limit?: number,
    reverse?: boolean
  ): Promise<AsyncIterable<Event<P, M>>> {
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

    if(eventMatcher) {
      let valuePos = 1;
      for(const prop in eventMatcher) {
        const [matchWhere, value] = this.matchObjectToWhereClause(prop, valuePos, eventMatcher[prop]);
        where += matchWhere + ' AND ';
        if(Array.isArray(value)) {
          bindings.push(...value);
          valuePos += value.length;
        } else {
          bindings.push(value);
          valuePos++;
        }
      }
      where += fromEventNo? `no > ${fromEventNo}` : '1=1';
    }

    const orderBy = reverse? 'desc' : 'asc';

    const query = `SELECT * FROM ${streamName} WHERE ${where} ORDER BY no ${orderBy} ` + (limit? `LIMIT ${limit}` : '') + ';';

    const cursor = await this.db.iterableCursor<Row<P,M>>(query, bindings);

    return asyncMap<Event<P, M>, Row<P,M>>(cursor, (row => ({
      uuid: row.uuid,
      name: row.name,
      payload: row.payload,
      meta: row.meta,
      createdAt: row.created_at
    })));
  }

  async delete(streamName: string, eventMatcher: EventMatcher): Promise<number> {
    const [query, bindings] = this.makeDeleteFromQuery(streamName, eventMatcher);

    const result = await this.db.query(query, bindings);

    return result.rowCount ? result.rowCount : 0;
  }


  public async republish(streamName: string, authService: AuthService, eventMatcher?: EventMatcher, fromEventId?: string, limit?: number): Promise<void> {
    const events = await this.load(streamName, eventMatcher, fromEventId, limit);

    for await (const event of events) {
      const mappedEvents = await mapMetadataFromEventStore([event], authService);
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
    matcher = checkMatchObject(prop, matcher);

    if(Array.isArray(matcher.val) && matcher.op !== MatchOperator.EQ) {
      throw new Error("[EventStore] A list of values is only allowed in combination with an equal match operator!");
    }

    if(["uuid", "name", "createdAt"].includes(matcher.evtProp as string)) {
      if(Array.isArray(matcher.val)) {
        return [`${matcher.evtProp} IN ($${matcher.val.map((v, i) => valuePos + i).join(', $')})`, matcher.val];
      } else {
        return [`${matcher.evtProp} ${this.toPgOperator(matcher.op)} $${valuePos}`, matcher.val];
      }
    }

    switch (matcher.op) {
      case MatchOperator.EQ:
        if(Array.isArray(matcher.val)) {
          return [`${matcher.evtProp}->>'${prop}' IN ($${matcher.val.map((v, i) => valuePos + i).join(', $')})`, matcher.val];
        }
      // eslint-disable-next-line no-fallthrough
      default:
        return [`jsonb(${matcher.evtProp}->'${prop}') ${this.toPgOperator(matcher.op)} $${valuePos}::jsonb`, JSON.stringify(matcher.val)];
    }
  }

  private toPgOperator(o: MatchOperator): string {
    switch (o) {
      case MatchOperator.EQ:
        return "=";
      case MatchOperator.GT:
        return ">";
      case MatchOperator.GTE:
        return ">=";
      case MatchOperator.LT:
        return "<";
      case MatchOperator.LTE:
        return "<=";
    }
  }
}
