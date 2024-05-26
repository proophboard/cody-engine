//import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {getConfiguredDocumentStore} from '../../be/src/infrastructure/configuredDocumentStore.js';

//speichert eine json datei basierend auf einer id
// format: TODO (FORMAT anzeigen wie die gespeicherte json aussehen soll)
// id ganz oben dann kommen die jsons die alle das selbe format haben aber einen
// unterschiedlichen namen je nachdem welche json das ist die der nutzer speichern
// wollte. z.B: { ENTSPANNT : data, AUFREGEND : data, KNALLIG : data}
export async function save(id, json) {
  const documentStore = getConfiguredDocumentStore();
  const collectionName = "users";

  // Sammlung hinzufügen
  await documentStore.addCollection(collectionName);

  // Dokument hinzufügen
  const doc = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com"
  };

  await documentStore.addDoc(collectionName, doc.id.toString(), doc);
  console.log("Dokument hinzugefügt:", doc);

  // Dokument abrufen
  const retrievedDoc = await documentStore.getDoc(collectionName, "1");
  console.log("Dokument abgerufen:", retrievedDoc);

  // Dokument aktualisieren
  const updatedDoc = {
    name: "John A. Doe",
    email: "john.a.doe@example.com"
  };

  await documentStore.updateDoc(collectionName, "1", updatedDoc);
  console.log("Dokument aktualisiert:", updatedDoc);

  // Aktualisiertes Dokument abrufen
  const updatedRetrievedDoc = await documentStore.getDoc(collectionName, "1");
  console.log("Aktualisiertes Dokument abgerufen:", updatedRetrievedDoc);

  // Dokument löschen
  await documentStore.deleteDoc(collectionName, "1");
  console.log("Dokument gelöscht");
};

//returnt eine json datei basierend auf einer id
//format: TODO (format anzeigen wie die returnt json aussieht)
export async function get(id){
    return null
}

