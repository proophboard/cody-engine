//import {InMemoryDocumentStore} from "@event-engine/infrastructure/DocumentStore/InMemoryDocumentStore";
import {getConfiguredDocumentStore} from '../../be/src/infrastructure/configuredDocumentStore';

//Eine collection oder ID ist zb die ID eines mitarbeiters
//Ein doc ist dann die kombination aus questionnaire und json die gespeichert wird.

//Einen präfix den wir brauchen um sicherzustellen, dass man in das Speichermedium dinge speichern kann die nicht ausversehen gleich heißen wie die ID eines USERS
const prefix = "O4S-ai-"
const documentStore = getConfiguredDocumentStore();
//speichert die json für applytheme mit dem questionaire datei basierend auf einer id und einem Namen
export async function saveDoc(id: string, name : string, json: any, questionnaire : any) {
  const fullId = `${prefix}${id}`

  const doc = {
    questionnaire : questionnaire,
    json : json
  }

  await documentStore.addDoc(fullId, name, doc);

  if (await documentStore.getDoc(fullId, name)) {
    console.log(`Dokument erfolgreich hinzugefügt mit der ID: ${fullId} und dem namen ${name}`);
  }
  else {
    console.log("MÖP schlecht")
  }
};

//returnt eine json datei basierend auf einer id
//format: { questionnaire: {...}, json: {...}}
//Questionnaire sind die fragen und die json ist die json die man 1:1 so in applyTheme setzen kann
//Hier muss der präfix nicht gesetzt werden weil man den präfix schon in der id mit übergibt
export interface doc {
  json: any;  
  questionnaire: any;  
  
}

export async function getDoc(id: any, name: any) : Promise<doc | null> {
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

//returnt alle Docs in allen ID´s die mit "O4S-ai-" beginnen
export async function getAllDocs() :  Promise<any> {
  const docs = await documentStore.getAllO4SaiDocs();
  return docs
}

export async function getAllDocsForSpecificId(docId: string) {
  const docs = await documentStore.getAllO4SaiDocs();

  if (docs.hasOwnProperty(docId)) {
    return docs[docId];
  } else {
    throw new Error(`Document with ID ${docId} not found`);
  }
}

//Löscht ein Document in einer ID
export async function deleteDoc(id: any, name: any){
  await documentStore.deleteDoc(id, name)
}

//Löscht eine ID und alle Dokumente darunter
export async function deleteID(id: any){
  await documentStore.dropCollection(id)
}

//Debugmethode für die devs
export async function deleteEverything(){
  const docsToDelete = await documentStore.getAllO4SaiDocs()
  const keys = Object.keys(docsToDelete)

  for(const key of keys) {
    await documentStore.dropCollection(key)
    }  
  }

export async function getAiSource() : Promise<any> {
  return await documentStore.getDoc("O4S-aiSource","O4S-aiSource");
}

export async function setAiSource(aiSource: string) {
  await documentStore.addDoc("O4S-aiSource","O4S-aiSource", {aiSource});
}
