import express from 'express';
import { askAI } from './aiInterface';
import cors from 'cors';
import { generateAIPrompt, generateFixAIPrompt } from './promptGenerator';
import { saveDoc, getDoc, checkIfIDInUse, checkIfDocIsExisting } from './storageController';

// Erstellen einer neuen Express-Anwendung
const app = express();
const PORT = 3000;

// Speichern der Theme-Konfiguration (leztzt generierte antwort der ai)
let storedThemeConfig = {};

// Die ID mit der der User gerade "angemeldet" ist
let currentID: any;

// CORS und JSON Middleware verwenden
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Helper Funktion zum Überprüfen, ob ein String ein gültiges JSON ist
function isValidJSON(jsonString: string) {
  try {
    const parsed = JSON.parse(jsonString);
    return !!parsed && typeof parsed === 'object';
  } catch (e) {
    return false;
  }
}

// Funktion um die KI-Anfrage zu wiederholen, falls die Antwort nicht den Anforderungen entspricht
async function retryAskAI(AIprompt: string, preferences: any, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await askAI(AIprompt);
      console.log(`AI Response Attempt ${attempt}: ${response}`);

      //Das muss sein weil typescript ohne den if block sagt, dass response null sein könnte
      let jsonMatch = null
      if(response){
      jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/i) || response.match(/```(?:\s*([\s\S]*?)\s*)```/i) || response.match(/({[\s\S]*})/i);
      } 
      if (jsonMatch && jsonMatch[1]) {
        const extractedJSON = jsonMatch[1].trim();
        console.log(`Extracted JSON: ${extractedJSON}`);

        if (isValidJSON(extractedJSON)) {
          const jsonResponse = JSON.parse(extractedJSON);
          console.log(`Valid JSON found on attempt ${attempt}`);
          return jsonResponse;
        } else {
          console.warn(`Attempt ${attempt} failed: Extracted JSON is invalid.`);
          AIprompt = generateFixAIPrompt(response, preferences);
        }
      } else {
        console.warn(`Attempt ${attempt} failed: No JSON code block found.`);
        AIprompt = generateFixAIPrompt(response, preferences);
      }
    } catch (error) {
      //Dieses if else muss auch wegen typescript sein weil man sonst nicht error.message aufrufen kann da er sagt das error vom type "unknown" ist
      if (error instanceof Error) {
        console.warn(`Attempt ${attempt} failed: ${error.message}`);
        AIprompt = generateFixAIPrompt(error.message, preferences);
    } else {
        console.warn(`Attempt ${attempt} failed with an unknown error`);
        AIprompt = generateFixAIPrompt('Unknown error', preferences);
    }
    }
  }
  throw new Error('All attempts to get a valid AI response failed.');
}

// Endpunkt zum Generieren einer Theme-Konfiguration mit KI
app.post('/api/generate-with-ai', async (req, res) => {
  //userPreferences muss gespeichert werden
  //storedThemeConfig
  const userPreferences = req.body;
  let AIprompt = generateAIPrompt(userPreferences);
  try {
    //kann es theoretisch sein das in storedThemeConfig etwas ist was keinen sinn macht?
    storedThemeConfig = await retryAskAI(AIprompt, userPreferences);
    res.json({ success: true, theme: storedThemeConfig });
  } catch (error) {
    console.error('AI Request failed:', error);
  }
});

// Speichert questionaire und json wenn es die ID noch nicht gibt. Wirft ein Error falls es sie gibt
app.post('/api/try-set-id', async (req, res) => {
  const data = req.body;
  await checkIfIDInUse(data.id)

  if(!data.id){
    res.json({success : false, idInUse : false, message : "Die ID darf nicht leer sein!"})
  } else if(await checkIfIDInUse(data.id)){
    res.json({success : false, idInUse : true, message : "Die ID ist bereits in verwendung"})
  } else {
    currentID = data.id
    //console.log(`Die jetzige ID nach try-set-id ist: ${currentID}`)
    res.json({success : true, idInUse : false, message : "Alles supi"})

  }
});

app.post('/api/force-set-ID', async (req, res) => {
  const data = req.body;
  currentID = data.id
  res.json({success : true})
  //console.log(`Die jetzige ID ist nach force-set-id ist: ${currentID}`)
});

// Speichert questionaire und json direkt ab#
//Habe getestet ab hier funktioniert es. Unten sieht man ein beispiel welches format es sein muss
//Die generierte KI antwort wird nicht gespeichert da man sie ja bei bedarf aus dem questionaire erstellen kann
app.post('/api/save-questionnaire', async (req, res) => {
  const data = req.body;

  if (!data.saveUnder) {
    res.json({success : false, message : "Der Name darf nicht leer sein!"})
  } else if (await checkIfDocIsExisting(currentID, data.saveUnder)){
    res.json({success : false, message : "Name für diese ID bereits vergeben"})
  } else {
    await saveDoc(currentID, data.saveUnder, storedThemeConfig, data.message)
    res.json({success : true, message : "Alles supi"})
  }
  //dummy
  //await saveDoc("ID STRING", "NAME STRING" , {letzteJson : data}, {frage1 : "aw1", frage2 : "aw1"})
});

app.get('/getID')

app.listen(PORT, () => {
  console.log(currentID)
  console.log(`AI Backend Server running on port ${PORT}`);
});

export default generateAIPrompt;
