import {Pool, QueryResult} from 'pg';
import Cursor from "pg-cursor";

export enum IsolationLevel {
  readUncommitted = 'READ UNCOMMITTED',
  readCommitted = 'READ COMMITTED',
  repeatableRead = 'REPEATABLE READ',
  serializable = 'SERIALIZABLE',
}

export class DB {
  private readonly pool: Pool;

  public constructor(pool: Pool) {
    this.pool = pool;

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async query(query: string, values?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();

    try {
      return await client.query(query, values);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      client.release();
    }
  }

  async iterableCursor<T>(query: string, values?: any[]): Promise<AsyncIterable<T>> {
    const client = await this.pool.connect();
    let clientReleased = false;

    try {
      const cursor = client.query(new Cursor(query, values));

      return {
        [Symbol.asyncIterator] () {
          return {
            async next() {
              return new Promise((resolve, reject) => {
                cursor.read(1, (err, rows) => {
                  if(err) {
                    client.release(true);
                    clientReleased = true;
                    reject(err);
                    return;
                  }

                  if(rows.length === 0) {
                    client.release();
                    clientReleased = true;
                    resolve({done: true, value: undefined});
                  } else {
                    resolve({done: false, value: rows[0]});
                  }
                })
              })
            }
          }
        }
      }
    } catch (error) {
      console.error(error);

      if(!clientReleased) {
        client.release(true);
      }

      throw error;
    }
  }

  async transaction (queryGenerator: any, isolationLevel?: IsolationLevel) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Note: Default level is READ COMMITTED (https://www.postgresql.org/docs/9.5/transaction-iso.html)
      if (isolationLevel) {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      }

      const sequence = queryGenerator();
      let previousResult: QueryResult|undefined = undefined;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value: queryData }: { done: boolean; value: [string]|[string, any[]]} =
          sequence.next(previousResult);

        if (done) break;
        previousResult = await client.query(queryData[0], queryData[1]);
      }

      await client.query('COMMIT');
    } catch (error) {
      console.error(error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

