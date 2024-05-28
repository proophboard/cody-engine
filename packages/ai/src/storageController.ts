//import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {getConfiguredDocumentStore} from '../../be/src/infrastructure/configuredDocumentStore';

//Einen präfix den wir brauchen um sicherzustellen, dass man in das Speichermedium dinge speichern kann die nicht ausversehen gleich heißen wie die ID eines USERS
const prefix = "O4S-ai-"
const documentStore = getConfiguredDocumentStore();
//speichert eine json datei basierend auf einer id
// format: TODO (FORMAT anzeigen wie die gespeicherte json aussehen soll)
// id ganz oben dann kommen die jsons die alle das selbe format haben aber einen
// unterschiedlichen namen je nachdem welche json das ist die der nutzer speichern
// wollte. z.B: { ENTSPANNT : data, AUFREGEND : data, KNALLIG : data}
export async function saveDoc(id: string, name : string, json: any, questionaire : any) {
  const fullId = `${prefix}${id}`

  const doc = {
    questionaire : questionaire,
    json : json
  }

  await documentStore.addDoc(fullId, name, doc);
  console.log("Dokument hinzugefügt:", doc);

  if (await documentStore.getDoc(fullId, name)) {
    console.log("Dokument erfolgreich hinzugefügt");
  }
  else {
    console.log("MÖP schlecht")
  }
};

//returnt eine json datei basierend auf einer id
//format:
export async function getDoc(id: any, name: any){
  const fullId = `${prefix}${id}`
    return await documentStore.getDoc(id, name)
}

//Gibt true zurück wenn es die ID schon gibt, sonst false
export async function checkIfIDInUse(id: string) : Promise<boolean> {
  const fullId = `${prefix}${id}`
  return await documentStore.hasCollection(fullId);
};

//Gibt true zurück wenn der name in der ID schon existiert, sonst false
export async function checkIfDocIsExisting(id: any, name: any) : Promise<boolean> {
  const fullId = `${prefix}${id}`
  const doc = await documentStore.getDoc(fullId, name);
  if(doc){
    return true
  } else {
    return false
  }
};
