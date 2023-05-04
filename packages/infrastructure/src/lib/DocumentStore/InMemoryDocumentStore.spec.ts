import {Filter} from "@event-engine/infrastructure/DocumentStore/Filter";
import {EqFilter} from "@event-engine/infrastructure/DocumentStore/Filter/EqFilter";
import {AndFilter} from "@event-engine/infrastructure/DocumentStore/Filter/AndFilter";
import {OrFilter} from "@event-engine/infrastructure/DocumentStore/Filter/OrFilter";
import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";

describe('InMemoryDocumentStore', () => {
  const ds = new InMemoryDocumentStore();

  const TEST_COLLECTION = 'test';

  const TEST_DOC_ID = 'd816ef69-3c74-4a0e-ae9c-6a9f7abdc0ef';
  const TEST_DOC2_ID = '76e43e5f-8b49-4212-93e5-2497b6783e46';

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
  }

  const findDocsHelper = async (collection: string, filter: Filter): Promise<[string[], any[]]> => {
    const docsIterator = await ds.findDocs(collection, filter);

    const ids = [];
    const docs = [];

    for await (const [id, doc] of docsIterator) {
      ids.push(id);
      docs.push(doc);
    }

    return [ids, docs];
  };

  beforeEach(async () => {
    // @todo clear ds?
  });

  it('finds docs', async () => {
    await ds.addCollection(TEST_COLLECTION);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC_ID, TEST_DOC);
    await ds.addDoc(TEST_COLLECTION, TEST_DOC2_ID, TEST_DOC2);

    const [ids, docs] = await findDocsHelper(
      TEST_COLLECTION,
      new OrFilter(
        new AndFilter(
          new EqFilter('info.year', 1990),
          new EqFilter('architect.firstName', 'Some'),
        ),
        new EqFilter('name', 'App Not HQ'),
      )
    );

    expect(ids).toStrictEqual([TEST_DOC_ID, TEST_DOC2_ID]);
    expect(docs).toStrictEqual([TEST_DOC, TEST_DOC2]);
  });
});

