import {PostgresDocumentStore} from "@event-engine/infrastructure/DocumentStore/PostgresDocumentStore";
import {AnyFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyFilter";
import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {OrFilter} from "@event-engine/infrastructure/DocumentStore/Filter/OrFilter";
import {DocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/DocIdFilter";
import {ExistsFilter} from "@event-engine/infrastructure/DocumentStore/Filter/ExistsFilter";
import {GtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GtFilter";
import {GteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/GteFilter";
import {LtFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LtFilter";
import {LteFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LteFilter";
import {InArrayFilter} from "@event-engine/infrastructure/DocumentStore/Filter/InArrayFilter";
import {LikeFilter} from "@event-engine/infrastructure/DocumentStore/Filter/LikeFilter";
import {NotFilter} from "@event-engine/infrastructure/DocumentStore/Filter/NotFilter";
import {AnyOfDocIdFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfDocIdFilter";
import {AnyOfFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AnyOfFilter";
import {PartialSelect, SortOrder} from "@event-engine/infrastructure/DocumentStore";
import {FieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/FieldIndex";
import {MultiFieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/MultiFieldIndex";
import {MetadataFieldIndex} from "@event-engine/infrastructure/DocumentStore/Index/MetadataFieldIndex";
import {getConfiguredDB} from "@server/infrastructure/configuredDB";

describe('PostgresDocumentStore', () => {
  const db = getConfiguredDB();
  const ds = new PostgresDocumentStore(db);

  const TEST_COLLECTION = 'test';

  const TEST_DOC_ID = 'd816ef69-3c74-4a0e-ae9c-6a9f7abdc0ef';
  const TEST_DOC2_ID = '76e43e5f-8b49-4212-93e5-2497b6783e46';
  const TEST_DOC3_ID = 'fe956347-9822-4db4-ba81-0fbc2aa2aae2';

  const TEST_DOC = {
    buildingId: TEST_DOC_ID,
    name: 'App HQ',
    info: {
      height: 10,
      year: 1990,
    },
    architect: {
      firstName: 'Some',
      lastName: 'Person',
    },
    isHQ: true,
    tags: ['nice view', 'well connected'],
    priority: 100,
  };
  const TEST_DOC2 = {
    buildingId: TEST_DOC2_ID,
    name: 'App Not HQ',
    info: {
      height: 10,
      year: 2005,
    },
    architect: {
      firstName: 'Another',
    },
    priority: 100,
  };
  const TEST_DOC3 = {
    buildingId: TEST_DOC3_ID,
    priority: 50,
  };

  const findDocsHelper = async (collection: string, filter: Filter, skip?: number, limit?: number, orderBy?: SortOrder): Promise<[string[], any[]]> => {
    const docsIterator = await ds.findDocs(collection, filter, skip, limit, orderBy);

    const ids = [];
    const docs = [];

    for await (const [id, doc] of docsIterator) {
      ids.push(id);
      docs.push(doc);
    }

    return [ids, docs];
  };

  const findPartialDocsHelper = async (collection: string, partialSelect: PartialSelect, filter: Filter, skip?: number, limit?: number): Promise<any[]> => {
    const docsIterator = await ds.findPartialDocs(collection, partialSelect, filter, skip, limit);

    const docs = [];

    for await (const doc of docsIterator) {
      docs.push(doc);
    }

    return docs;
  };

  const getCollectionColumnsHelper = async (collection: string): Promise<string[]> => {
    const query = `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${collection}'`;
    return (await db.query(query)).rows.map((row: any) => row['column_name']);
  };

  beforeEach(async () => {
    await db.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public`);
  });

  it('adds collection', async () => {
    await ds.addCollection(TEST_COLLECTION);

    const hasCollection = await ds.hasCollection(TEST_COLLECTION);
    const hasIndex = await ds.hasCollectionIndex(TEST_COLLECTION, FieldIndex.forField('some_index', 'name'));
    expect(hasCollection).toBeTruthy();
    expect(hasIndex).toBeFalsy();
  });

  it('adds collection with index', async () => {
    const index = FieldIndex.forField('some_index', 'name');

    await ds.addCollection(TEST_COLLECTION, index);

    const hasCollection = await ds.hasCollection(TEST_COLLECTION);
    const hasIndex = await ds.hasCollectionIndex(TEST_COLLECTION, index);
    expect(hasCollection).toBeTruthy();
    expect(hasIndex).toBeTruthy();
  });

  it('adds collection with metadata index', async () => {
    const index = MetadataFieldIndex.forField('some_index', 'meta_field', 'asc', false);

    await ds.addCollection(TEST_COLLECTION, index);

    const hasCollection = await ds.hasCollection(TEST_COLLECTION);
    const hasIndex = await ds.hasCollectionIndex(TEST_COLLECTION, index);
    expect(hasCollection).toBeTruthy();
    expect(hasIndex).toBeTruthy();
  });

  it('drops collection', async () => {
    await ds.addCollection(TEST_COLLECTION);
    expect(await ds.hasCollection(TEST_COLLECTION)).toBeTruthy();

    await ds.dropCollection(TEST_COLLECTION);

    const hasCollectionAfterDrop = await ds.hasCollection(TEST_COLLECTION);
    expect(hasCollectionAfterDrop).toBeFalsy();
  });

  it('adds doc', async () => {
    await ds.addCollection(TEST_COLLECTION);

    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);

    const doc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);
    expect(doc).toStrictEqual(TEST_DOC);
  });

  it('fails adding doc that already exists', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);

    // @todo should we catch and throw our own exceptions in DocumentStore? Because this is a postgres error and (at least technically) breaks the abstraction
    await expect(ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, {})).rejects.toEqual(
      new Error('duplicate key value violates unique constraint "test_pkey"'),
    );
  });

  it('updates doc', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);

    await ds.updateDoc(TEST_COLLECTION, TEST_DOC_ID, { name: 'Update Test' });
    const updatedDoc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);

    expect(updatedDoc).toStrictEqual({
      ...TEST_DOC,
      name: 'Update Test',
    });
  });

  // @todo should update doc throw an error if doc doesn't exist?

  it('upserts existing doc', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);

    await ds.upsertDoc(TEST_COLLECTION, TEST_DOC_ID, {
      name: 'Update Test',
      info: { height: 100 },
    });
    const updatedDoc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);

    expect(updatedDoc).toStrictEqual({
      ...TEST_DOC,
      name: 'Update Test',
      info: { height: 100 },
    });
  });

  it('upserts new doc', async () => {
    await ds.addCollection(TEST_COLLECTION);

    expect(await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID)).toBeFalsy();
    await ds.upsertDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    const updatedDoc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);

    expect(updatedDoc).toStrictEqual(TEST_DOC);
  });

  it('deletes doc', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    expect(await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID)).toBeTruthy();

    await ds.deleteDoc(TEST_COLLECTION, TEST_DOC_ID);

    expect(await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID)).toBeFalsy();
  });

  // @todo should delete doc throw an error if doc doesn't exist?

  it('gets partial doc', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);

    const partialDoc = await ds.getPartialDoc(
      TEST_COLLECTION,
      TEST_DOC_ID,
      [
        'name',
        ['id', 'buildingId'],
        ['architect.person.surname', 'architect.lastName'],
        ['$merge', 'info'],
      ]
    );

    expect(partialDoc).toStrictEqual({
      name: TEST_DOC['name'],
      id: TEST_DOC['buildingId'],
      architect: {
        person: {
          surname: TEST_DOC['architect']['lastName'],
        },
      },
      ...TEST_DOC['info'],
    });
  });

  it('finds docs with AnyFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(TEST_COLLECTION, new AnyFilter());

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });

  it('finds docs with EqFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(TEST_COLLECTION, new EqFilter('architect.firstName', 'Some'));

    expect(ids).toStrictEqual([TEST_DOC_ID]);
    expect(docs).toStrictEqual([TEST_DOC]);
  });

  it('finds docs with AndFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new AndFilter(
        new EqFilter('info.height', 10),
        new EqFilter('architect.firstName', 'Some'),
      ),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID]);
    expect(docs).toStrictEqual([TEST_DOC]);
  });

  it('finds docs with OrFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new OrFilter(
        new EqFilter('info.year', 2005),
        new EqFilter('name', 'App HQ'),
      ),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });

  it('finds docs with DocIdFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new DocIdFilter(TEST_DOC2_ID),
    );

    expect(ids).toStrictEqual([TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC2]);
  });

  it('finds docs with ExistsFilter on root level', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new ExistsFilter('name'),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });

  it('finds docs with ExistsFilter on deeper level', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new ExistsFilter('architect.lastName'),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID]);
    expect(docs).toStrictEqual([TEST_DOC]);
  });

  it('finds docs with GtFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new GtFilter('info.year', 1990),
    );

    expect(ids).toStrictEqual([TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC2]);
  });

  it('finds docs with GteFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new GteFilter('info.year', 1990),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });

  it('finds docs with LtFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new LtFilter('name', 'App Not HQ'),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID]);
    expect(docs).toStrictEqual([TEST_DOC]);
  });

  it('finds docs with LteFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new LteFilter('name', 'App Not HQ'),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });

  it('finds docs with InArrayFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new InArrayFilter('tags', 'well connected'),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID]);
    expect(docs).toStrictEqual([TEST_DOC]);
  });

  it('finds docs with LikeFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new LikeFilter('architect.firstName', '%om%'),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID]);
    expect(docs).toStrictEqual([TEST_DOC]);
  });

  it('finds docs with basic NotFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new NotFilter(
        new EqFilter('buildingId', TEST_DOC_ID),
      ),
    );

    expect(ids).toStrictEqual([TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC2]);
  });

  it('finds docs with AnyOfDocIdFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new AnyOfDocIdFilter([TEST_DOC_ID, TEST_DOC2_ID]),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });

  it('finds docs with AnyOfFilter', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new AnyOfFilter('architect.firstName', ['Some', 'Another']),
    );

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });

  it('finds docs with skip and limit', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    const [skipIds, skipDocs] = await findDocsHelper(
      TEST_COLLECTION,
      new AnyFilter(),
      1,
    );
    const [limitIds, limitDocs] = await findDocsHelper(
      TEST_COLLECTION,
      new AnyFilter(),
      undefined,
      2,
    );
    const [skipLimitIds, skipLimitDocs] = await findDocsHelper(
      TEST_COLLECTION,
      new AnyFilter(),
      1,
      1,
    );

    expect(skipIds).toStrictEqual([TEST_DOC2_ID, TEST_DOC3_ID]);
    expect(skipDocs).toStrictEqual([TEST_DOC2, TEST_DOC3]);
    expect(limitIds).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(limitDocs).toStrictEqual([TEST_DOC, TEST_DOC2]);
    expect(skipLimitIds).toStrictEqual([TEST_DOC2_ID]);
    expect(skipLimitDocs).toStrictEqual([TEST_DOC2]);
  });

  it('finds docs with sort order', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new AnyFilter(),
      undefined,
      undefined,
      [
        { prop: 'priority', sort: 'desc' },
        { prop: 'architect.firstName', sort: 'asc' }
      ]
    );

    expect(ids).toStrictEqual([TEST_DOC2_ID, TEST_DOC_ID, TEST_DOC3_ID]);
    expect(docs).toStrictEqual([TEST_DOC2, TEST_DOC, TEST_DOC3]);
  });

  it('finds doc ids', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    const docIds = await ds.findDocIds(TEST_COLLECTION, new AnyFilter());

    expect(docIds).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID, TEST_DOC3_ID]);
  });

  it('finds doc ids with skip and limit', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    const docIds = await ds.findDocIds(TEST_COLLECTION, new AnyFilter(), 1, 1);

    expect(docIds).toStrictEqual([TEST_DOC2_ID]);
  });

  it('finds partial docs', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    const docs = await findPartialDocsHelper(
      TEST_COLLECTION,
      [
        ['buildingName', 'name'],
        ['id', 'buildingId'],
      ],
      new AnyFilter(),
    );

    expect(docs).toStrictEqual([
      { id: TEST_DOC_ID, buildingName: TEST_DOC.name },
      { id: TEST_DOC2_ID, buildingName: TEST_DOC2.name },
      { id: TEST_DOC3_ID, buildingName: null },
    ]);
  });

  it('counts docs', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    const count = await ds.countDocs(
      TEST_COLLECTION,
      new GteFilter('info.height', 5)
    );

    expect(count).toStrictEqual(2);
  });

  it('updates many', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    await ds.updateMany(
      TEST_COLLECTION,
      new AnyOfDocIdFilter([TEST_DOC2_ID, TEST_DOC3_ID]),
      { newValue: 1234 }
    );

    const docs = (await findDocsHelper(TEST_COLLECTION, new AnyFilter()))[1];
    expect(docs).toStrictEqual([
      TEST_DOC,
      { ...TEST_DOC2, newValue: 1234 },
      { ...TEST_DOC3, newValue: 1234 },
    ]);
  });

  it('deletes many', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    await ds.deleteMany(
      TEST_COLLECTION,
      new AnyOfDocIdFilter([TEST_DOC2_ID, TEST_DOC3_ID]),
    );

    const docs = (await findDocsHelper(TEST_COLLECTION, new AnyFilter()))[1];
    expect(docs).toStrictEqual([TEST_DOC]);
  });

  it('replaces doc', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    await ds.replaceDoc(
      TEST_COLLECTION,
      TEST_DOC2_ID,
      { dummy: 'data' },
    );

    const docs = (await findDocsHelper(TEST_COLLECTION, new AnyFilter()))[1];
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC3, { dummy: 'data' }]);
  });

  it('replaces many', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC3_ID, TEST_DOC3);

    await ds.replaceMany(
      TEST_COLLECTION,
      new AnyOfDocIdFilter([TEST_DOC_ID, TEST_DOC3_ID]),
      { dummy: 'data' }
    );

    const docs = (await findDocsHelper(TEST_COLLECTION, new AnyFilter()))[1];
    expect(docs).toStrictEqual([TEST_DOC2, { dummy: 'data' }, { dummy: 'data' }]);
  });

  it('adds collection index', async () => {
    await ds.addCollection(TEST_COLLECTION);
    const index = FieldIndex.forField('some_index', 'name');
    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeFalsy();

    await ds.addCollectionIndex(TEST_COLLECTION, index);

    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeTruthy();
  });

  it('drops collection index', async () => {
    await ds.addCollection(TEST_COLLECTION);
    const index = FieldIndex.forField('some_index', 'name', 'asc', true);
    await ds.addCollectionIndex(TEST_COLLECTION, index);
    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeTruthy();

    await ds.dropCollectionIndex(TEST_COLLECTION, index);

    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeFalsy();
  });

  it('adds multi field collection index', async () => {
    await ds.addCollection(TEST_COLLECTION);
    const index = MultiFieldIndex.forFieldsWithSort(
      'some_index',
      [{ field: 'name' }, { field: 'info.height', sort: 'desc' }],
      true
    );
    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeFalsy();

    await ds.addCollectionIndex(TEST_COLLECTION, index);

    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeTruthy();
  });

  it('adds metadata field collection index', async () => {
    await ds.addCollection(TEST_COLLECTION);
    const index = MetadataFieldIndex.forField('some_index', 'meta_field', 'asc', false);
    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeFalsy();

    await ds.addCollectionIndex(TEST_COLLECTION, index);

    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index)).toBeTruthy();
    expect(await getCollectionColumnsHelper(TEST_COLLECTION)).toStrictEqual(['id', 'doc', 'meta_field']);
  });

  it('removes metadata field collection index', async () => {
    const index1 = MetadataFieldIndex.forField('some_index', 'meta_field', 'asc', false);
    const index2 = MetadataFieldIndex.forField('some_index2', 'meta_field2');
    await ds.addCollection(TEST_COLLECTION, index1);
    await ds.addCollectionIndex(TEST_COLLECTION, index2)
    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index1)).toBeTruthy();
    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index2)).toBeTruthy();
    expect(await getCollectionColumnsHelper(TEST_COLLECTION)).toStrictEqual(['id', 'doc', 'meta_field', 'meta_field2']);

    await ds.dropCollectionIndex(TEST_COLLECTION, index1);

    expect(await ds.hasCollectionIndex(TEST_COLLECTION, index1)).toBeFalsy();
    expect(await getCollectionColumnsHelper(TEST_COLLECTION)).toStrictEqual(['id', 'doc', 'meta_field2']);
  });

  it('adds doc with metadata', async () => {
    const index1 = MetadataFieldIndex.forField('some_index', 'meta_field', 'asc', false);
    const index2 = MetadataFieldIndex.forField('some_index2', 'meta_field2');
    await ds.addCollection(TEST_COLLECTION, index1);
    await ds.addCollectionIndex(TEST_COLLECTION, index2)

    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC, { meta_field: 'test', meta_field2: 'test' });

    const doc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);
    expect(doc).toStrictEqual(TEST_DOC);
  });

  it('updates doc with metadata', async () => {
    const index1 = MetadataFieldIndex.forField('some_index', 'meta_field', 'asc', false);
    const index2 = MetadataFieldIndex.forField('some_index2', 'meta_field2');
    await ds.addCollection(TEST_COLLECTION, index1);
    await ds.addCollectionIndex(TEST_COLLECTION, index2)
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC, { meta_field: 'test', meta_field2: 'test' });

    await ds.updateDoc(TEST_COLLECTION, TEST_DOC_ID, {}, { meta_field: 'test2', meta_field2: 'test2' });

    const doc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);
    expect(doc).toStrictEqual(TEST_DOC);
  });

  it('upserts doc with metadata', async () => {
    const index1 = MetadataFieldIndex.forField('some_index', 'meta_field', 'asc', false);
    const index2 = MetadataFieldIndex.forField('some_index2', 'meta_field2');
    await ds.addCollection(TEST_COLLECTION, index1);
    await ds.addCollectionIndex(TEST_COLLECTION, index2)
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC, { meta_field: 'test', meta_field2: 'test' });

    await ds.upsertDoc(TEST_COLLECTION, TEST_DOC_ID, { test: 'test' }, { meta_field: 'test2', meta_field2: 'test2' });

    const doc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);
    expect(doc).toStrictEqual({ ...TEST_DOC, test: 'test' });
  });

  it('replaces doc with metadata', async () => {
    const index1 = MetadataFieldIndex.forField('some_index', 'meta_field', 'asc', false);
    const index2 = MetadataFieldIndex.forField('some_index2', 'meta_field2');
    await ds.addCollection(TEST_COLLECTION, index1);
    await ds.addCollectionIndex(TEST_COLLECTION, index2)
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC, { meta_field: 'test', meta_field2: 'test' });

    await ds.replaceDoc(TEST_COLLECTION, TEST_DOC_ID, { test: 'test' }, { meta_field: 'test2', meta_field2: 'test2' });

    const doc = await ds.getDoc(TEST_COLLECTION, TEST_DOC_ID);
    expect(doc).toStrictEqual({ test: 'test' });
  });
});

