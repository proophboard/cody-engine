import {DocumentStore, PartialSelect, SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {DB} from "@event-engine/infrastructure/Postgres/DB";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {PostgresFilterProcessor} from "@event-engine/infrastructure/DocumentStore/Postgres/PostgresFilterProcessor";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {
  PARTIAL_SELECT_DOC_ID, PARTIAL_SELECT_DOC_VERSION, PARTIAL_SELECT_MERGE,
  PostgresQueryBuilder
} from "@event-engine/infrastructure/DocumentStore/Postgres/PostgresQueryBuilder";
import {Index} from "@event-engine/infrastructure/DocumentStore/Index";
import {PostgresIndexProcessor} from "@event-engine/infrastructure/DocumentStore/Postgres/PostgresIndexProcessor";
import {MetadataFieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/MetadataFieldIndex";

// @TODO: Handle database schema (public by default)


export class PostgresDocumentStore implements DocumentStore {

  private db: DB;
  private queryBuilder: PostgresQueryBuilder;
  private docIdSchema = 'UUID NOT NULL';

  constructor(db: DB, docIdSchema?: string) {
    this.db = db;
    this.queryBuilder = new PostgresQueryBuilder(
      new PostgresFilterProcessor(),
      new PostgresIndexProcessor(),
    );

    if (docIdSchema) {
      this.docIdSchema = docIdSchema;
    }
  }

  async addCollection(collectionName: string, index?: Index): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    await this.db.transaction(function*() {
      yield _this.queryBuilder.makeAddCollectionQuery(collectionName, _this.docIdSchema);

      if (index) {
        if (index instanceof MetadataFieldIndex) {
          yield _this.queryBuilder.makeAddCollectionMetadataColumnQuery(collectionName, index);
        }

        yield _this.queryBuilder.makeAddCollectionIndexQuery(collectionName, index);
      }
    });
  }

  async hasCollection(collectionName: string): Promise<boolean> {
    const [queryString, bindings] = this.queryBuilder.makeHasCollectionQuery(collectionName);
    const result = await this.db.query(queryString, bindings);

    return result.rows[0].exists;
  }

  async dropCollection(collectionName: string): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeDropCollectionQuery(collectionName);
    await this.db.query(queryString, bindings);
  }

  public async addCollectionIndex(collectionName: string, index: Index): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    await this.db.transaction(function*() {
      if (index instanceof MetadataFieldIndex) {
        yield _this.queryBuilder.makeAddCollectionMetadataColumnQuery(collectionName, index);
      }

      yield _this.queryBuilder.makeAddCollectionIndexQuery(collectionName, index);
    });
  }

  public async hasCollectionIndex(collectionName: string, index: Index): Promise<boolean> {
    const [queryString, bindings] = this.queryBuilder.makeHasCollectionIndexQuery(collectionName, index);
    const result = await this.db.query(queryString, bindings);

    return Boolean(result.rows[0]);
  }

  public async dropCollectionIndex(collectionName: string, index: Index): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    await this.db.transaction(function*() {
      yield _this.queryBuilder.makeDropCollectionIndexQuery(collectionName, index);

      if (index instanceof MetadataFieldIndex) {
        yield _this.queryBuilder.makeDropCollectionMetadataColumnQuery(collectionName, index);
      }
    });
  }

  async addDoc(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeAddDocQuery(collectionName, docId, doc, metadata, version);

    await this.db.query(queryString, bindings);
  }

  async updateDoc(collectionName: string, docId: string, docOrSubset: object, metadata?: object, version?: number): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeUpdateDocQuery(collectionName, docId, docOrSubset, metadata, version);
    await this.db.query(queryString, bindings);
  }

  async upsertDoc(collectionName: string, docId: string, docOrSubset: object, metadata?: object, version?: number): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeUpsertDocQuery(collectionName, docId, docOrSubset, metadata, version);
    await this.db.query(queryString, bindings);
  }

  public async replaceDoc(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeReplaceDocQuery(collectionName, docId, doc, metadata, version);
    await this.db.query(queryString, bindings);
  }

  async getDoc<D extends object>(collectionName: string, docId: string): Promise<D | null> {
    const [queryString, bindings] = this.queryBuilder.makeGetDocQuery(collectionName, docId);
    const result = await this.db.query(queryString, bindings);

    if (result.rowCount !== 1) {
      return null;
    }

    return result.rows[0].doc;
  }

  async getDocAndVersion<D extends object>(collectionName: string, docId: string): Promise<{doc: D, version: number} | null> {
    const [queryString, bindings] = this.queryBuilder.makeGetDocQuery(collectionName, docId);
    const result = await this.db.query(queryString, bindings);

    if (result.rowCount !== 1) {
      return null;
    }

    return {
      doc: result.rows[0].doc,
      version: parseInt(result.rows[0].version)
    };
  }

  async getDocVersion(collectionName: string, docId: string): Promise<number | null> {
    const [queryString, bindings] = this.queryBuilder.makeGetDocVersionQuery(collectionName, docId);
    const result = await this.db.query(queryString, bindings);

    if (result.rowCount !== 1) {
      return null;
    }

    return parseInt(result.rows[0].version);
  }

  async getPartialDoc<D extends object>(collectionName: string, docId: string, partialSelect: PartialSelect): Promise<D | null> {
    const [queryString, bindings] = this.queryBuilder.makeGetPartialDocQuery(collectionName, docId, partialSelect);
    const result = await this.db.query(queryString, bindings);

    if (result.rowCount !== 1) {
      return null;
    }

    return this.transformPartialDoc(partialSelect, result.rows[0]);
  }

  async deleteDoc(collectionName: string, docId: string): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeDeleteDocQuery(collectionName, docId);
    await this.db.query(queryString, bindings);
  }

  async updateMany(collectionName: string, filter: Filter, docOrSubset: object, metadata?: object, version?: number): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeUpdateManyQuery(collectionName, filter, docOrSubset, metadata, version);
    await this.db.query(queryString, bindings);
  }

  public async replaceMany(collectionName: string, filter: Filter, doc: object, metadata?: object, version?: number): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeReplaceManyQuery(collectionName, filter, doc, metadata, version);
    await this.db.query(queryString, bindings);
  }

  async deleteMany(collectionName: string, filter: Filter): Promise<void> {
    const [queryString, bindings] = this.queryBuilder.makeDeleteManyQuery(collectionName, filter);
    await this.db.query(queryString, bindings);
  }

  async findDocs<D extends object>(collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<AsyncIterable<[string, D, number]>> {
    this.assertSkipValid(skip);
    this.assertLimitValid(limit);

    const [queryString, bindings] = this.queryBuilder.makeFindDocsQuery(collectionName, filter, skip, limit, orderBy);
    const cursor = await this.db.iterableCursor(queryString, bindings);

    return asyncMap(cursor, (row: any) => [row.id, row.doc, row.version]);
  }

  async findPartialDocs<D extends object>(collectionName: string, partialSelect: PartialSelect, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<AsyncIterable<[string, D, number]>> {
    this.assertSkipValid(skip);
    this.assertLimitValid(limit);

    const [queryString, bindings] = this.queryBuilder.makeFindPartialDocsQuery(collectionName, partialSelect, filter, skip, limit, orderBy);
    const cursor = await this.db.iterableCursor(queryString, bindings);

    return asyncMap(cursor, (row: any) => [row[PARTIAL_SELECT_DOC_ID], this.transformPartialDoc(partialSelect, row), parseInt(row[PARTIAL_SELECT_DOC_VERSION])]);
  }

  async findDocIds(collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<string[]> {
    this.assertSkipValid(skip);
    this.assertLimitValid(limit);

    const [queryString, bindings] = this.queryBuilder.makeFindDocIdsQuery(collectionName, filter, skip, limit, orderBy);
    const result = await this.db.query(queryString, bindings);

    return result.rows.map(row => row.id);
  }

  async countDocs(collectionName: string, filter: Filter): Promise<number> {
    const [queryString, bindings] = this.queryBuilder.makeCountDocsQuery(collectionName, filter);
    const result = await this.db.query(queryString, bindings);

    return parseInt(result.rows[0]['count']);
  }

  public useDocIdSchema (docIdSchema: string) {
    this.docIdSchema = docIdSchema;
  }

  public getDocIdSchema (): string {
    return this.docIdSchema;
  }

  private transformPartialDoc(partialSelect: Array<string|[string, string]>, doc: any): any {
    let finalDoc: Record<string, any> = {};

    for (const item of partialSelect) {
      const isStringItem = typeof item === 'string';

      const alias = isStringItem ? item : item[0];

      if (alias === '$merge') {
        if (!doc[PARTIAL_SELECT_DOC_ID]) {
          continue;
        }

        finalDoc = {...finalDoc, ...doc[PARTIAL_SELECT_MERGE]};
        continue;
      }

      const value = doc[alias] || null;

      if (alias.includes('.')) {
        let tmpDocRef = finalDoc;
        const aliasItems = alias.split('.');

        aliasItems.slice(0, -1).forEach(aliasItem => {
          if (!(aliasItem in tmpDocRef)) {
            tmpDocRef[aliasItem] = {};
            tmpDocRef = tmpDocRef[aliasItem];
          }
        });

        tmpDocRef[aliasItems.slice(-1)[0]] = value;
        continue;
      }

      finalDoc[alias] = value;
    }

    return finalDoc;
  }

  private assertSkipValid(skip?: number) {
    if (skip && (!Number.isInteger(skip) || skip <= 0)) {
      throw new Error(`The skip parameter must be a positive integer. Got: ${skip}`);
    }
  }

  private assertLimitValid(limit?: number) {
    if (limit && (!Number.isInteger(limit) || limit <= 0)) {
      throw new Error(`The skip parameter must be a positive integer. Got: ${limit}`);
    }
  }
}
