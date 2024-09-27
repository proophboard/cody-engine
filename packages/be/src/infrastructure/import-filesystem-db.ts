import {getConfiguredMessageBox} from "@server/infrastructure/configuredMessageBox";
import {getConfiguredEventStore, PERSISTENT_STREAMS_FILE} from "@server/infrastructure/configuredEventStore";
import {getConfiguredDocumentStore, PERSISTENT_COLLECTION_FILE} from "@server/infrastructure/configuredDocumentStore";
import * as fs from "node:fs";

// Do not remove messageBox, without that import the script fails
// Somehow ts-node is not able to load the event store module correctly
// Doing the message box import first solves the problem
// It seems to be a strange import ordering problem
// @TODO: Find solution without import workaround
const messageBox = getConfiguredMessageBox();
const eventStore = getConfiguredEventStore();
const documentStore = getConfiguredDocumentStore();

const eventStreams = JSON.parse(fs.readFileSync(PERSISTENT_STREAMS_FILE).toString());

for (const eventStream in eventStreams.streams) {
  console.log(`Importing events of stream ${eventStream} ...`);
  eventStore.appendTo(eventStream, eventStreams.streams[eventStream], undefined, undefined, true);
  console.log(`Imported ${eventStreams.streams[eventStream].length} events into ${eventStream}`)
}

const collections = JSON.parse(fs.readFileSync(PERSISTENT_COLLECTION_FILE).toString());

for (const collectionName in collections.documents) {
  const collection = collections.documents[collectionName];

  console.log(`Importing documents of collection ${collectionName} ...`);

  for (const docId in collection) {
    const doc = collection[docId];
    documentStore.addDoc(collectionName, docId, doc.doc, undefined, doc.version);
  }

  console.log(`Imported ${Object.values(collection).length} documents into ${collectionName}.`);
}
