import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {getConfiguredEventStore, PUBLIC_STREAM, WRITE_MODEL_STREAM} from "@server/infrastructure/configuredEventStore";
import {getConfiguredDocumentStore} from "@server/infrastructure/configuredDocumentStore";
import {aggregates} from "@app/shared/aggregates";
import {PostgresDocumentStore} from "@event-engine/infrastructure/DocumentStore/PostgresDocumentStore";

// Do not remove messageBox, without that import the script fails
// Somehow ts-node is not able to load the event store module correctly
// Doing the message box import first solves the problem
// It seems to be a strange import ordering problem
// @TODO: Find solution without import workaround
const messageBox = getConfiguredMessageBox();
const eventStore = getConfiguredEventStore();

eventStore.hasStream(WRITE_MODEL_STREAM).then(hasStream => {
  if(!hasStream) {
    eventStore.createStream(WRITE_MODEL_STREAM).then(success => {
      if(success) {
        console.log(`${WRITE_MODEL_STREAM} stream created.`);
      } else {
        console.log(`Failed to create stream: ${WRITE_MODEL_STREAM}.`);
      }
    })
  }
})

eventStore.hasStream(PUBLIC_STREAM).then(hasStream => {
  if(!hasStream) {
    eventStore.createStream(PUBLIC_STREAM).then(success => {
      if(success) {
        console.log(`${PUBLIC_STREAM} stream created.`);
      } else {
        console.log(`Failed to create stream: ${PUBLIC_STREAM}.`);
      }
    })
  }
})

const documentStore = getConfiguredDocumentStore();

interface Collection {
  name: string;
  docIdSchema?: string;
}

// Override defaults by manually defining a collection

const collections: Record<string, Collection> = {};

for (const aggregateDesc of Object.values(aggregates)) {
  if(!collections[aggregateDesc.collection]) {
    collections[aggregateDesc.collection] = {
      name: aggregateDesc.collection
    }
  }
}

const isPostgresStore = documentStore instanceof PostgresDocumentStore;

Object.values(collections).forEach(c => {
  documentStore.hasCollection(c.name).then(hasCollection => {
    if(!hasCollection) {
      let oldDocIdSchema;

      if(isPostgresStore) {
        oldDocIdSchema = documentStore.getDocIdSchema();

        if(c.docIdSchema) {
          documentStore.useDocIdSchema(c.docIdSchema);
        }
      }

      documentStore.addCollection(c.name).then(() => {
        console.log(`${c.name} collection created.`);
      });

      if(isPostgresStore && oldDocIdSchema) {
        documentStore.useDocIdSchema(oldDocIdSchema);
      }
    }
  })
})
