import {Filter} from "./DocumentStore/Filter";
import {Index} from "@event-engine/infrastructure/DocumentStore/Index";

export type Sort = 'asc' | 'desc';
export type PartialSelect = Array<string|[string, string]>;
export interface SortOrderItem {
  prop: string;
  sort: Sort;
}
export type SortOrder = Array<SortOrderItem>;

export interface DocumentStore {
  addCollection: (collectionName: string, index?: Index) => Promise<void>;
  hasCollection: (collectionName: string) => Promise<boolean>;
  dropCollection: (collectionName: string) => Promise<void>;

  addCollectionIndex: (collectionName: string, index: Index) => Promise<void>;
  hasCollectionIndex: (collectionName: string, index: Index) => Promise<boolean>;
  dropCollectionIndex: (collectionName: string, index: Index) => Promise<void>;

  addDoc: (collectionName: string, docId: string, doc: object, metadata?: object, version?: number) => Promise<void>;
  updateDoc: (collectionName: string, docId: string, docOrSubset: object, metadata?: object, version?: number) => Promise<void>;
  upsertDoc: (collectionName: string, docId: string, docOrSubset: object, metadata?: object, version?: number) => Promise<void>;
  replaceDoc: (collectionName: string, docId: string, doc: object, metadata?: object, version?: number) => Promise<void>;
  getDoc: <D extends object>(collectionName: string, docId: string) => Promise<D | null>;
  getPartialDoc: <D extends object>(collectionName: string, docId: string, partialSelect: PartialSelect) => Promise<D | null>;
  getDocAndVersion: <D extends object>(collectionName: string, docId: string) => Promise<{doc: D, version: number} | null>;
  getDocVersion: (collectionName: string, docId: string) => Promise<number | null>;
  deleteDoc: (collectionName: string, docId: string) => Promise<void>;

  updateMany: (collectionName: string, filter: Filter, docOrSubset: object, metadata?: object, version?: number) => Promise<void>;
  replaceMany: (collectionName: string, filter: Filter, doc: object, metadata?: object, version?: number) => Promise<void>;
  deleteMany: (collectionName: string, filter: Filter) => Promise<void>;
  findDocs: <D extends object>(collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<AsyncIterable<[string, D, number]>>;
  findPartialDocs: <D extends object>(collectionName: string, partialSelect: PartialSelect, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<AsyncIterable<[string, D, number]>>;
  findDocIds: (collectionName: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder) => Promise<string[]>;
  countDocs: (collectionName: string, filter: Filter) => Promise<number>;
}
