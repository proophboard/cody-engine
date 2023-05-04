# DocumentStore Specification

## Methods
Overview of all the methods provided by the DocumentStore interface.
Please note that even if there are no specific error cases defined for a specific method, any implementation of the DocumentStore might still throw errors.

### addCollection
Adds a new collection to the DocumentStore.

- Parameters:
  - `collectionName: string` The collection name
  - `index?: Index` An index to be added
- Return Type: `Promise<void>`
- Errors:
  - If a collection with this name exists already

### hasCollection
Checks whether a collection exists in the DocumentStore.

- Parameters:
  - `collectionName: string` The collection name
- Return Type: `Promise<boolean>`
  - `true` if the collection exists
  - `false` if no collection with this name exists

### dropCollection
Deletes a collection from the DocumentStore.

- Parameters:
  - `collectionName: string` The collection name
- Return Type: `Promise<void>`
- Errors:
  - If no collection with this name exists

### addCollectionIndex
Adds an index to the collection.

- Parameters:
  - `collectionName: string` The collection name
  - `index: Index` The index properties (see: [`Index`](#index))
- Return Type: `Promise<void>`
- Errors: tbd

### hasCollectionIndex
Checks whether the collection has an index.

- Parameters:
  - `collectionName: string` The collection name
  - `index: Index` The index properties (see: [`Index`](#index))
- Return Type: `Promise<boolean>`
- Errors: tbd

### dropCollectionIndex
Deletes an index from the collection.

- Parameters:
  - `collectionName: string` The collection name
  - `index: Index` The index properties (see: [`Index`](#index))
- Return Type: `Promise<void>`
- Errors: tbd

### addDoc
Adds a new document to an existing collection.

- Parameters: 
  - `collectionName: string` The collection name
  - `docId: string` The id of the new document
  - `doc: object` The new document
  - `metadata?: object` The document's metadata
- Return Type: `Promise<void>`
- Errors:
  - If a document with this id exists already

### updateDoc
Updates an existing document. 
The update is done partially depending on the specified top-level properties. 
In case all the document's top-level properties are specified, this will perform a full update.

- Parameters:
  - `collectionName: string` The collection name
  - `docId: string` The id of the document to be updated
  - `docOrSubset: object` The new document
  - `metadata?: object` The document's metadata
- Return Type: `Promise<void>`
- Errors:
  - If a document with this id does not exist

### upsertDoc
Performs an update or an insert depending on whether a document with this id exists already in the specified collection.
This is equivalent to [`addDoc`](#adddoc) if no document with this id exists and to [`updateDoc`](#updatedoc) otherwise.

- Parameters:
  - `collectionName: string` The collection name
  - `docId: string` The id of the document to be upserted
  - `docOrSubset: object` The new document
  - `metadata?: object` The document's metadata
- Return Type: `Promise<void>`

### replaceDoc
Completely replaces an existing document with a new document.
This is equivalent to [`updateDoc`](#updatedoc) if all the existing document's top-level properties are defined in the new document.

- Parameters:
  - `collectionName: string` The collection name
  - `docId: string` The id of the document to be replaced
  - `doc: object` The new document
  - `metadata?: object` The document's metadata
- Return Type: `Promise<void>`
- Errors:
  - If a document with this id does not exist

### getDoc
Fetches a document from the collection and returns it.
Returns the document if it was found, `null` otherwise.

- Generics: `<D extends object>`
- Parameters:
  - `collectionName: string` The collection name
  - `docId: string` The id of the document to be fetched
- Return Type: `Promise<D | null>`

### getPartialDoc
Fetches a partial document from the collection and returns it.
Returns the partial document if it was found, `null` otherwise.

- Generics: `<D extends object>`
- Parameters:
  - `collectionName: string` The collection name
  - `docId: string` The id of the document to be fetched
  - `partialSelect: PartialSelect` The partial selection rules (see [`PartialSelect`](#partialselect))
- Return Type: `Promise<D | null>`

### deleteDoc
Deletes the document from the collection.

- Parameters:
  - `collectionName: string` The collection name
  - `docId: string` The id of the document to be fetched
- Return Type: `Promise<void>`
- Errors:
  - If no document with this id exists in the collection

### updateMany
Updates many documents in the collection.
This is equivalent to [`updateDoc`](#updatedoc) for all documents matched by the filter.

- Parameters:
  - `collectionName: string` The collection name
  - `filter: Filter` The filter for selecting relevant documents (see [`Filter`](#filter))
  - `docOrSubset: object` The new document
- Return Type: `Promise<void>`

### replaceMany
Replaces many documents in the collection.
This is equivalent to [`replaceDoc`](#replacedoc) for all documents matched by the filter.

- Parameters:
  - `collectionName: string` The collection name
  - `filter: Filter` The filter for selecting relevant documents (see [`Filter`](#filter))
  - `doc: object` The new document
- Return Type: `Promise<void>`

### deleteMany
Deletes many documents from the collection.
This is equivalent to [`deleteDoc`](#deletedoc) for all documents matched by the filter.

- Parameters:
  - `collectionName: string` The collection name
  - `filter: Filter` The filter for selecting relevant documents (see [`Filter`](#filter))
- Return Type: `Promise<void>`

### findDocs
Retrieves many documents from the collection. 
Returns an `AsyncIterable` that produces all documents that were matched by the filter.

- Generics: `<D extends object>`
- Parameters:
  - `collectionName: string` The collection name
  - `filter: Filter` The filter for selecting relevant documents (see [`Filter`](#filter))
  - `skip?: number` The number of documents skipped at the beginning of the result list
  - `limit?: number` The maximum number of documents to be selected
  - `orderBy?: OrderBy` The sort order of the documents (see [`OrderBy`](#orderby))
- Return Type: `Promise<AsyncIterable<[string, D]>>`
- Errors:
  - If `skip` is truthy and not a positive integer
  - If `limit` is truthy and not a positive integer

### findPartialDocs
Retrieves many partial documents from the collection.
Returns an `AsyncIterable` that produces all partial documents that were matched by the filter.

- Generics: `<D extends object>`
- Parameters:
  - `collectionName: string` The collection name
  - `partialSelect: PartialSelect` The partial selection rules (see [`PartialSelect`](#partialselect))
  - `filter: Filter` The filter for selecting relevant documents (see [`Filter`](#filter))
  - `skip?: number` The number of documents skipped at the beginning of the result list
  - `limit?: number` The maximum number of documents to be selected
  - `orderBy?: OrderBy` The sort order of the documents (see [`OrderBy`](#orderby))
- Return Type: `Promise<AsyncIterable<[string, D]>>`
- Errors:
  - If `skip` is truthy and not a positive integer
  - If `limit` is truthy and not a positive integer

### findDocIds
Retrieves a list of document ids from the collection.
Returns the ids of  all documents that were matched by the filter.

- Parameters:
  - `collectionName: string` The collection name
  - `filter: Filter` The filter for selecting relevant documents (see [`Filter`](#filter))
  - `skip?: number` The number of documents skipped at the beginning of the result list
  - `limit?: number` The maximum number of documents to be selected
  - `orderBy?: OrderBy` The sort order of the documents (see [`OrderBy`](#orderby))
- Return Type: `Promise<string[]>`
- Errors:
  - If `skip` is truthy and not a positive integer
  - If `limit` is truthy and not a positive integer

### countDocs
Counts the number of documents in the collection that match the specified filter.

- Parameters:
  - `collectionName: string` The collection name
  - `filter: Filter` The filter for selecting relevant documents (see [`Filter`](#filter))
- Return Type: `Promise<number>`


## Types

### PartialSelect
tbd

### Filter
tbd

### Index
Depending on the concrete implementation of the DocumentStore (e.g. Postgres), adding indexes can considerably increase the performance of queries.
The DocumentStore specification offers some basic implementation independent index options.
- `FieldIndex` for creating an index on any single field of the document
- `MultiFieldIndex` for creating an index over multiple fields of the document
- `MetadataFieldIndex` for creating an index on any single metadata field

#### FieldIndex
Properties:
- `name: string` The name (and identifier) of the index
- `field: string` The document field on which the index should be applied
- `unique?: boolean` Whether values are unique or not
- `sort?: 'asc'|'desc'` The sort order of the index

#### MultiFieldIndex
Properties:
- `name: string` The name (and identifier) of the index
- `fields: Array<{ field: string, sort?: 'asc'|'desc' }>` The document fields on which the index should be applied and the sort order
- `unique?: boolean` Whether values are unique or not

#### MetadataFieldIndex
Properties:
- `name: string` The name (and identifier) of the index
- `field: string` The metadata field on which the index should be applied
- `unique?: boolean` Whether values are unique or not
- `sort?: 'asc'|'desc'` The sort order of the index

### OrderBy
Defines how the documents should be ordered. 
This can be done for multiple properties and in ascending as well as descending order.

For example, the following `OrderBy` expression will cause the documents to be sorted first by highest priority and, if the priority of two documents is identical, by firstName in ascending order.

```typescript
const orderBy: OrderBy = [
  { prop: 'priority', sort: 'desc' },
  { prop: 'architect.firstName', sort: 'asc' }
]
```
