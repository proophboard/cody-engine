/* eslint-disable no-prototype-builtins */
import fs from "fs";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {DocumentStore, PartialSelect, SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {asyncEmptyIterator} from "@event-engine/infrastructure/helpers/async-empty-iterator";
import {InMemoryFilterProcessor} from "@event-engine/infrastructure/DocumentStore/InMemory/InMemoryFilterProcessor";
import {Index} from "@event-engine/infrastructure/DocumentStore/Index";
import {areValuesEqualForAllSorts, getValueFromPath} from "@event-engine/infrastructure/DocumentStore/helpers";

export class InMemoryDocumentStore implements DocumentStore {
  private readonly documents: {[collectionName: string]: {[docId: string]: object}} = {};
  private readonly persistOnDisk: boolean;
  private readonly storageFile: string;
  private readonly filterProcessor: InMemoryFilterProcessor;

  constructor(storageFile?: string) {
    this.persistOnDisk = !!storageFile;
    this.storageFile = storageFile || '//memory';
    this.filterProcessor = new InMemoryFilterProcessor();

    if(this.persistOnDisk) {
      if(! fs.existsSync(this.storageFile)) {
        fs.writeFileSync(this.storageFile, JSON.stringify({documents: {}}));
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.documents = require(this.storageFile).documents;
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

  public async addDoc(collectionName: string, docId: string, doc: object): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      this.documents[collectionName] = {};
    }

    this.documents[collectionName][docId] = doc;

    this.persistOnDiskIfEnabled();
  }

  public async updateDoc(collectionName: string, docId: string, docOrSubset: object): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      this.documents[collectionName] = {};
    }

    if (!this.documents[collectionName][docId]) {
      throw new Error("Cannot update document with id: " + docId + ". No document found.");
    }
    const doc = this.documents[collectionName][docId];
    this.documents[collectionName][docId] = {...doc, ...docOrSubset};

    this.persistOnDiskIfEnabled();
  }

  public async upsertDoc(collectionName: string, docId: string, doc: object): Promise<void> {
    if (await this.getDoc(collectionName, docId)) {
      await this.updateDoc(collectionName, docId, doc);
      return;
    }

    await this.addDoc(collectionName, docId, doc);
  }

  public async replaceDoc(collectionName: string, docId: string, doc: object): Promise<void> {
    if (!this.documents.hasOwnProperty(collectionName)) {
      this.documents[collectionName] = {};
    }

    if (!this.documents[collectionName][docId]) {
      throw new Error("Cannot update document with id: " + docId + ". No document found.");
    }

    this.documents[collectionName][docId] = {...doc};

    this.persistOnDiskIfEnabled();
  }

  public async getDoc<D extends object>(collectionName: string, docId: string): Promise<D | null> {
    if(!this.documents.hasOwnProperty(collectionName)) {
      return null;
    }

    if(!this.documents[collectionName].hasOwnProperty(docId)) {
      return null;
    }

    return this.documents[collectionName][docId] as D;
  }

  public async getPartialDoc<D extends object>(collectionName: string, docId: string, partialSelect: PartialSelect): Promise<D | null> {
    return new Promise(resolve => resolve(null));
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

  public async updateMany(collectionName: string, filter: any, set: object): Promise<void> {
  }

  public async replaceMany(collectionName: string, filter: any, set: object): Promise<void> {
  }

  public async deleteMany(collectionName: string, filter: Filter): Promise<void> {
  }

  public async findDocs<D extends object>(collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<AsyncIterable<[string, D]>> {
    if(!this.documents.hasOwnProperty(collectionName)) {
      return asyncEmptyIterator(); // @todo supposed to not throw an error?
    }

    if(typeof skip === 'undefined') {
      skip = 0;
    }

    let count = 0;
    const resultSet: [string, D][] = [];

    const filterFunction = this.filterProcessor.process(filter);

    for(const docId in this.documents[collectionName]) {
      if(!this.documents[collectionName].hasOwnProperty(docId)) {
        continue;
      }

      const doc = this.documents[collectionName][docId] as D;

      if(!filterFunction(doc, docId)) {
        continue;
      }

      count++;
      if(skip && count <= skip) continue;
      if(limit && (count - skip) > limit) break;

      resultSet.push([docId, doc]);
    }

    if(orderBy) {
      const comparedSorts: SortOrder = [];
      orderBy.forEach(sort => {
        resultSet.sort((aResult, bResult) => {
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

    const iter = async function *() {
      for (const result of resultSet) {
        yield result;
      }
    }

    return iter();
  }

  public async findPartialDocs<D extends object>(collectionName: string, partialSelect: PartialSelect, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<AsyncIterable<[string, D]>> {
    return undefined as any;
  }

  public async findDocIds(collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<string[]> {
    return [];
  }

  public async countDocs(collectionName: string, filter: Filter): Promise<number> {
    this.assertHasCollection(collectionName);

    const filterFunction = this.filterProcessor.process(filter);

    let counter = 0;
    for(const docId in this.documents[collectionName]) {
      if (!this.documents[collectionName].hasOwnProperty(docId)) {
        continue;
      }

      const doc = this.documents[collectionName][docId];

      if (!filterFunction(doc, docId)) {
        continue;
      }

      counter++;
    }

    return counter;
  }

  private persistOnDiskIfEnabled() {
    if(this.persistOnDisk) {
      fs.writeFileSync(this.storageFile, JSON.stringify({documents: this.documents}, null, 2));
    }
  }

  private assertHasCollection(collectionName: string) {
    if (!this.documents.hasOwnProperty(collectionName)) {
      throw new Error(`Collection with name ${collectionName} does not exist`);
    }
  }
}
