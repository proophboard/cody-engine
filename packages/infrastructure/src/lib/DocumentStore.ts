import {Filter} from "./DocumentStore/Filter";
import {Index} from "@event-engine/infrastructure/DocumentStore/Index";
import {SequenceProvider} from "@event-engine/infrastructure/sequence-provider/sequence-provider";

export type Sort = 'asc' | 'desc';
export type FieldName = string;
export type AliasFieldNameMapping = {field: string; alias: string;};
export type PartialSelect = Array<FieldName|AliasFieldNameMapping|Lookup>;

export interface Lookup {
  lookup: string;
  alias?: string; /* Lookup collection alias */
  using?: string; /* Which query collection provides the localKey? Defaults to "local" alias */
  optional?: boolean; /* Local select is included in result set even if foreign doc cannot be found. */
  on: {
    localKey: string;
    foreignKey?: string;
    and?: Filter;
  },
  /* If lookup is optional and foreignDoc cannot be found, non-optional select fields are returned as NULL */
  select?: Array<FieldName|AliasFieldNameMapping>;
}

export const isAliasFieldNameMapping = (partialSelectItem: unknown): partialSelectItem is AliasFieldNameMapping => {
  return typeof partialSelectItem === "object" && !isLookup(partialSelectItem);
}

export const isLookup = (partialSelectItem: unknown): partialSelectItem is Lookup => {
  return typeof partialSelectItem === "object" && Object.keys(partialSelectItem as object).includes('lookup');
}

export interface SortOrderItem {
  prop: string;
  sort: Sort;
}
export type SortOrder = Array<SortOrderItem>;

export interface DocumentStore extends SequenceProvider {
  addCollection: (collectionName: string, index?: Index) => Promise<void>;
  hasCollection: (collectionName: string) => Promise<boolean>;
  dropCollection: (collectionName: string) => Promise<void>;

  addCollectionIndex: (collectionName: string, index: Index) => Promise<void>;
  hasCollectionIndex: (collectionName: string, index: Index) => Promise<boolean>;
  dropCollectionIndex: (collectionName: string, index: Index) => Promise<void>;

  addSequenceIfNotExists: (name: string, start?: number, incrementBy?: number) => Promise<void>;
  dropSequence: (name: string) => Promise<void>;

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
