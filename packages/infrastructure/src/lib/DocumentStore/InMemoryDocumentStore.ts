/* eslint-disable no-prototype-builtins */
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {
  AliasFieldNameMapping,
  DocumentStore, isLookup,
  Lookup,
  PartialSelect,
  SortOrder
} from "@event-engine/infrastructure/DocumentStore";
import {asyncEmptyIterator} from "@event-engine/infrastructure/helpers/async-empty-iterator";
import {InMemoryFilterProcessor} from "@event-engine/infrastructure/DocumentStore/InMemory/InMemoryFilterProcessor";
import {Index} from "@event-engine/infrastructure/DocumentStore/Index";
import {
  areValuesEqualForAllSorts,
  getValueFromPath,
  transformPartialDoc
} from "@event-engine/infrastructure/DocumentStore/helpers";
import {Filesystem} from "@event-engine/infrastructure/helpers/fs";
import {asyncIteratorToArray} from "@event-engine/infrastructure/helpers/async-iterator-to-array";
import {asyncMap} from "@event-engine/infrastructure/helpers/async-map";
import {cloneDeep} from "lodash";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {DocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/DocIdFilter";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {asyncFilter} from "@event-engine/infrastructure/helpers/async-filter";

export type Documents = {[collectionName: string]: {[docId: string]: {doc: object, version: number}}};

export class InMemoryDocumentStore implements DocumentStore {
  private documents: Documents = {};
  private persistOnDisk: boolean;
  private readonly storageFile: string;
  private readonly filterProcessor: InMemoryFilterProcessor;
  private readonly fs: Filesystem;

  constructor(fs: Filesystem, storageFile?: string) {
    this.persistOnDisk = !!storageFile;
    this.storageFile = storageFile || '//memory';
    this.filterProcessor = new InMemoryFilterProcessor();
    this.fs = fs;

    if(this.persistOnDisk) {
      if(! this.fs.existsSync(this.storageFile)) {
        this.fs.writeFileSync(this.storageFile, JSON.stringify({documents: this.documents}));
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.documents = this.migrateDocs(require(this.storageFile).documents);
    }
  }

  public async addCollection(collectionName: string, index?: Index): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      this.documents[collectionName] = {};
    }

    this.persistOnDiskIfEnabled();
  }

  public async hasCollection(collectionName: string): Promise<boolean> {
    return this.documents.hasOwnProperty(collectionName);
  }

  public async dropCollection(collectionName: string): Promise<void> {
    if (await this.hasCollection(collectionName)) {
      delete this.documents[collectionName];
    }
  }

  public async addCollectionIndex(collectionName: string, index: Index): Promise<void> {
  }

  public async hasCollectionIndex(collectionName: string, index: Index): Promise<boolean> {
    return false;
  }

  public async dropCollectionIndex(collectionName: string, index: Index): Promise<void> {
  }

  public async addDoc(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      this.documents[collectionName] = {};
    }

    if(!version) {
      version = 1;
    }

    this.documents[collectionName][docId] = {doc: {...doc}, version};

    this.persistOnDiskIfEnabled();
  }

  public async updateDoc(collectionName: string, docId: string, docOrSubset: object, metadata?: object, version?: number): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      this.documents[collectionName] = {};
    }

    if (!this.documents[collectionName][docId]) {
      throw new Error("Cannot update document with id: " + docId + ". No document found.");
    }
    const doc = this.documents[collectionName][docId];

    if(!version) {
      version = doc.version + 1;
    }
    this.documents[collectionName][docId] = {doc: {...doc.doc, ...docOrSubset}, version};

    this.persistOnDiskIfEnabled();
  }

  public async upsertDoc(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): Promise<void> {
    if (await this.getDoc(collectionName, docId)) {
      await this.replaceDoc(collectionName, docId, doc, metadata, version);
      return;
    }

    await this.addDoc(collectionName, docId, doc, metadata, version);
  }

  public async replaceDoc(collectionName: string, docId: string, doc: object, metadata?: object, version?: number): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      this.documents[collectionName] = {};
    }

    if (!this.documents[collectionName][docId]) {
      throw new Error("Cannot update document with id: " + docId + ". No document found.");
    }

    const existingDoc = this.documents[collectionName][docId];

    if(!version) {
      version = existingDoc.version + 1;
    }

    this.documents[collectionName][docId] = {doc: {...doc}, version};

    this.persistOnDiskIfEnabled();
  }

  public async getDoc<D extends object>(collectionName: string, docId: string): Promise<D | null> {
    if(!this.documents.hasOwnProperty(collectionName)) {
      return null;
    }

    if(!this.documents[collectionName].hasOwnProperty(docId)) {
      return null;
    }

    return cloneDeep(this.documents[collectionName][docId].doc as D);
  }

  public async getPartialDoc<D extends object>(collectionName: string, docId: string, partialSelect: PartialSelect): Promise<D | null> {
    const result = await asyncIteratorToArray(
      await this.findPartialDocs<D>(collectionName, partialSelect, new DocIdFilter(docId), undefined, 1, undefined)
    );

    if(result.length === 0) {
      return null;
    }

    return result[0][1];
  }

  public async getDocAndVersion<D extends object>(collectionName: string, docId: string): Promise<{doc: D, version: number} | null> {
    if(!this.documents.hasOwnProperty(collectionName)) {
      return null;
    }

    if(!this.documents[collectionName].hasOwnProperty(docId)) {
      return null;
    }

    return cloneDeep(this.documents[collectionName][docId] as {doc: D, version: number});
  }

  public async getDocVersion<D extends object>(collectionName: string, docId: string): Promise<number | null> {
    if(!this.documents.hasOwnProperty(collectionName)) {
      return null;
    }

    if(!this.documents[collectionName].hasOwnProperty(docId)) {
      return null;
    }

    return this.documents[collectionName][docId].version;
  }

  public async deleteDoc(collectionName: string, docId: string): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      console.warn("Can't delete doc. Unknown collection provided: " + collectionName);
    }

    if(this.documents[collectionName][docId]) {
      delete this.documents[collectionName][docId];
    }

    this.persistOnDiskIfEnabled();
  }

  public async updateMany(collectionName: string, filter: Filter, set: object, metadata?: object, version?: number): Promise<void> {
    const docs = await asyncIteratorToArray(await this.findDocs(collectionName, filter));

    for (const [docId, doc] of docs) {
      await this.updateDoc(collectionName, docId, set, metadata, version);
    }

    return;
  }

  public async replaceMany(collectionName: string, filter: Filter, set: object, metadata?: object, version?: number): Promise<void> {
    const docs = await asyncIteratorToArray(await this.findDocs(collectionName, filter));

    for (const [docId, doc] of docs) {
      await this.replaceDoc(collectionName, docId, set, metadata, version);
    }

    return;
  }

  public async deleteMany(collectionName: string, filter: Filter): Promise<void> {
    const docs = await asyncIteratorToArray(await this.findDocs(collectionName, filter));

    for (const [docId, doc] of docs) {
      await this.deleteDoc(collectionName, docId);
    }

    return;
  }

  public async findDocs<D extends object>(collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<AsyncIterable<[string, D, number]>> {
    if(!this.documents.hasOwnProperty(collectionName)) {
      return asyncEmptyIterator(); // @todo supposed to not throw an error?
    }

    const collection: [string, D, number][] = [];

    for (const docId in this.documents[collectionName]) {
      const {doc, version} = this.documents[collectionName][docId];
      collection.push([docId, doc as D, version])
    }

    if(orderBy) {
      const comparedSorts: SortOrder = [];
      orderBy.forEach(sort => {
        collection.sort((aResult, bResult) => {
          if(!areValuesEqualForAllSorts(comparedSorts, aResult[1], bResult[1])) {
            return 0;
          }

          const aDocVal: any = getValueFromPath(sort.prop, aResult[1]);
          const bDocVal: any = getValueFromPath(sort.prop, bResult[1]);
          const sortNumber = sort.sort === 'asc'? -1 : 1;

          if(typeof aDocVal === 'undefined' && typeof bDocVal !== 'undefined') {
            return sortNumber * -1;
          }

          if(typeof aDocVal !== 'undefined' && typeof bDocVal === 'undefined' ) {
            return sortNumber
          }

          if(typeof aDocVal === 'undefined' && typeof bDocVal === 'undefined') {
            return 0;
          }

          return aDocVal < bDocVal ? sortNumber : sortNumber * -1;
        })

        comparedSorts.push(sort);
      })
    }

    if(typeof skip === 'undefined') {
      skip = 0;
    }

    let count = 0;
    const resultSet: [string, D, number][] = [];

    const filterFunction = this.filterProcessor.process(filter);

    for(const [docId,] of collection) {
      if(!this.documents[collectionName].hasOwnProperty(docId)) {
        continue;
      }

      const doc = this.documents[collectionName][docId] as {doc: D, version: number};

      if(!filterFunction(doc.doc, docId)) {
        continue;
      }

      count++;
      if(skip && count <= skip) continue;
      if(limit && (count - skip) > limit) break;

      resultSet.push([docId, cloneDeep(doc.doc), doc.version]);
    }

    const iter = async function *() {
      for (const result of resultSet) {
        yield result;
      }
    }

    return iter();
  }

  public async findPartialDocs<D extends object>(collectionName: string, partialSelect: PartialSelect, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<AsyncIterable<[string, D, number]>> {
    const cursor = await this.findDocs<D>(collectionName, filter, skip, limit, orderBy);

    return asyncFilter(asyncMap(cursor, async ([docId, doc, version]) => {
      let finalDoc: any = {};
      const docRegistry: Record<string, any> = {local: doc};

      for (const s of partialSelect) {
        if(isLookup(s)) {
          const foreignDoc = await this.lookupPartialDoc(s, docRegistry);

          if(!foreignDoc) {
            if(s.optional) {
              continue;
            } else {
              // Skip the entire document. async-filter removes the
              return [docId, undefined, version];
            }
          }

          const alias = s.alias || s.lookup;
          docRegistry[alias] = foreignDoc;

          if(s.select) {
            finalDoc = {
              ...finalDoc,
              ...this.selectFieldsFromDoc(s.select, foreignDoc)
            }
          }
          continue;
        }

        finalDoc = {
          ...finalDoc,
          ...this.selectFieldsFromDoc([s], doc)
        }
      }

      finalDoc = transformPartialDoc(partialSelect, finalDoc);

      return [docId, finalDoc, version];
    }), async ([docId, finalDoc, version]) => !!finalDoc);
  }

  public async findDocIds(collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<string[]> {
    const cursor = await this.findDocs(collectionName, filter, skip, limit, orderBy);

    return asyncIteratorToArray(asyncMap(cursor, ([docId,]) => docId));
  }

  public async countDocs(collectionName: string, filter: Filter): Promise<number> {
    this.assertHasCollection(collectionName);

    const filterFunction = this.filterProcessor.process(filter);

    let counter = 0;
    for(const docId in this.documents[collectionName]) {
      if (!this.documents[collectionName].hasOwnProperty(docId)) {
        continue;
      }

      const {doc} = this.documents[collectionName][docId];

      if (!filterFunction(doc, docId)) {
        continue;
      }

      counter++;
    }

    return counter;
  }

  public disableDiskStorage(): void {
    this.persistOnDisk = false;
  }

  public enableDiskStorage(): void {
    this.persistOnDisk = this.storageFile !== '//memory'
  }

  public flush(): void {
    this.persistOnDiskIfEnabled();
  }

  public async importDocuments(documents: Documents): Promise<void> {
    this.documents = this.migrateDocs(documents);
  }

  public async exportDocuments(): Promise<Documents> {
    return this.documents;
  }

  public syncExportDocuments(): Documents {
    return this.documents;
  }

  private selectFieldsFromDoc (partialSelect: Array<string|AliasFieldNameMapping>, doc: any): any {
    let finalDoc: any = {};

    partialSelect.forEach(item => {
      const isStringItem = typeof item === 'string';
      const alias = isStringItem ? item.replace(/\?$/, '') : item.alias;
      let field = isStringItem ? item : item.field;

      field = field.replace(/\?$/, '');

      const value = getValueFromPath<any>(field, doc, null);

      if(alias === "$merge") {
        finalDoc = {
          ...finalDoc,
          ...value
        }

        return;
      }

      finalDoc[alias] = value;
    })

    return finalDoc;
  }

  private async lookupPartialDoc(lookup: Lookup, docRegistry: Record<string, any>): Promise<any> {
    const using = lookup.using || 'local';
    const withDoc = docRegistry[using];

    if(!withDoc) {
      throw new Error(`Unable to lookup document using "${using}". The document is not specified in the partial select query.`);
    }

    const localKey = lookup.on.localKey;
    const localValue = getValueFromPath(localKey, withDoc);

    if(!localValue) {
      throw new Error(`Unable to perform lookup. Document "${using}" has no value set for localKey "${localKey}"`);
    }

    let filter: Filter = lookup.on.foreignKey ? new EqFilter(lookup.on.foreignKey, localValue) : new DocIdFilter(localValue);

    if(lookup.on.and) {
      filter = new AndFilter(filter, lookup.on.and);
    }

    const cursor = await this.findDocs(lookup.lookup, filter, 0, 1);

    const docs = await asyncIteratorToArray(cursor);

    if(docs.length) {
      const [docId, matchingDoc] = docs[0];

      return matchingDoc;
    } else {
      if(!lookup.select || !lookup.optional) {
        return undefined;
      }

      return this.selectFieldsFromDoc(lookup.select, {});
    }
  }

  private migrateDocs(documents: Documents): Documents {
    // Keep BC, convert old format (without dedicated version property) to new format
    // This mostly influences aggregate state, because the aggregate version was stored as part of the document
    // whereas now: state is becoming the doc itself and version is stored in new version property
    // Read Models also have a version now that gets incremented on update
    for (const collection in documents) {
      const collectionDocs = documents[collection];

      const firstDoc: any = Object.values(collectionDocs)[0];

      if(firstDoc && firstDoc.state) {
        for (const docId in collectionDocs) {
          collectionDocs[docId] = ((doc: any) => {
            if(doc.state) {
              return {
                doc: doc.state,
                version: doc.version || 1
              }
            } else {
              return {
                doc,
                version: 1
              }
            }
          })(collectionDocs[docId])

        }
        documents[collection] = collectionDocs;
      }
    }

    return documents;
  }

  private persistOnDiskIfEnabled() {
    if(this.persistOnDisk) {
      this.fs.writeFileSync(this.storageFile, JSON.stringify({documents: this.documents}, null, 2));
    }
  }

  private assertHasCollection(collectionName: string) {
    if (!this.documents.hasOwnProperty(collectionName)) {
      throw new Error(`Collection with name ${collectionName} does not exist`);
    }
  }
}
