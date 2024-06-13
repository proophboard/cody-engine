import express from 'express';
import { askAI } from './aiInterface';
import cors from 'cors';
import { generateAIPrompt } from './promptGenerator';
import { saveDoc, getDoc, checkIfIDInUse, checkIfDocIsExisting, getAllDocs, deleteEverything, deleteDoc, deleteID } from './storageController';

// Erstellen einer neuen Express-Anwendung
const app = express();
const PORT = 3000;

// Speichern der Theme-Konfiguration (leztzt generierte antwort der ai) (ehemals storedThemeConfig)
let latestGeneratedTheme = {};

// Das Theme das gerade angezeigt wird
let applyedTheme = {};

// Die ID mit der der User gerade "angemeldet" ist
let currentID: string;

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

// Helper Funktion zum Überprüfen, ob ein JSON leere Strings enthält
function hasEmptyStrings(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (Array.isArray(value)) {
    return value.some(hasEmptyStrings);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(hasEmptyStrings);
  }
  return false;
}

// Funktion um die KI-Anfrage zu wiederholen, falls die Antwort nicht den Anforderungen entspricht
async function retryAskAI(AIprompt: string, preferences: any, temperature: number, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await askAI(AIprompt, temperature);
      console.log(`AI Response Attempt ${attempt}: ${response}`);

      let jsonMatch = null;
      if (response) {
        jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/i) || response.match(/```(?:\s*([\s\S]*?)\s*)```/i) || response.match(/({[\s\S]*})/i);
      }
      if (jsonMatch && jsonMatch[1]) {
        const extractedJSON = jsonMatch[1].trim();
        console.log(`Extracted JSON: ${extractedJSON}`);

        if (isValidJSON(extractedJSON)) {
          const jsonResponse = JSON.parse(extractedJSON);
          console.log(`Valid JSON found on attempt ${attempt}`);

          if (!hasEmptyStrings(jsonResponse)) {
            return jsonResponse;
          } else {
            console.warn(`Attempt ${attempt} failed: JSON contains empty strings.`);
            AIprompt = generateAIPrompt(preferences, response);
          }
        } else {
          console.warn(`Attempt ${attempt} failed: Extracted JSON is invalid.`);
          AIprompt = generateAIPrompt(preferences, response);
        }
      } else {
        console.warn(`Attempt ${attempt} failed: No JSON code block found.`);
        AIprompt = generateAIPrompt(preferences, response);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Attempt ${attempt} failed: ${error.message}`);
        AIprompt = generateAIPrompt(preferences, error.message);
      } else {
        console.warn(`Attempt ${attempt} failed with an unknown error`);
        AIprompt = generateAIPrompt(preferences, 'Unknown error');
      }
    }
  }
  throw new Error('All attempts to get a valid AI response failed.');
}

// Endpunkt zum Generieren einer Theme-Konfiguration mit KI
app.post('/api/generate-with-ai', async (req, res) => {
  const { message, temperature } = req.body;
  const userPreferences = message;
  let AIprompt = generateAIPrompt(userPreferences);
  try {
    latestGeneratedTheme = await retryAskAI(AIprompt, userPreferences, temperature);
    applyedTheme = JSON.parse(JSON.stringify(latestGeneratedTheme));
    res.json({ success: true, theme: latestGeneratedTheme });
  } catch (error) {
    console.error('AI Request failed:', error);
    res.status(500).json({ success: false, message: 'Failed to generate theme with AI. Please try again later.' });
  }
});

// Speichert questionaire und json wenn es die ID noch nicht gibt. Wirft ein Error falls es sie gibt
app.post('/api/try-set-id', async (req, res) => {
  const data = req.body;
  await checkIfIDInUse(data.id);

  if (!data.id) {
    res.json({ success: false, idInUse: false, message: "Die ID darf nicht leer sein!" })
  } else if (await checkIfIDInUse(data.id)) {
    res.json({ success: false, idInUse: true, message: "Die ID ist bereits in verwendung" })
  } else {
    currentID = data.id
    //console.log(`Die jetzige ID nach try-set-id ist: ${currentID}`)
    res.json({ success: true, idInUse: false, message: "Alles supi" })

  }
});

app.post('/api/force-set-ID', async (req, res) => {
  const data = req.body;
  currentID = data.id
  res.json({ success: true })
  //console.log(`Die jetzige ID ist nach force-set-id ist: ${currentID}`)
});

// Speichert questionaire und json direkt ab
app.post('/api/save-questionnaire', async (req, res) => {
  const data = req.body;

  if (!data.saveUnder) {
    res.json({ success: false, message: "Der Name darf nicht leer sein!" })
  } else if (!currentID) {
    res.json({ success: false, message: "Die ID darf nicht leer sein!" })
  } else if (Object.keys(latestGeneratedTheme).length === 0) {
    res.json({ success: false, message: "Sie müssen zuerst ihren Fragebogen abschicken! Es wird immer die zuletzt abgeschickte Fragebogen gespeichert." })
  } else if (await checkIfDocIsExisting(currentID, data.saveUnder)) {
    res.json({ success: false, message: "Name für diese ID bereits vergeben" })
  } else {
    await saveDoc(currentID, data.saveUnder, latestGeneratedTheme, data.message)
    res.json({ success: true, message: "Theme erfolgreich gespeichert!" })
  }
});

// Braucht man um zb die Aktuelle ID zu bekommen nachdem Server neugestartet ist
app.get('/getID', async (req, res) => {
  if (!currentID) {
    res.json({ id: "" })
  } else {
    res.json({ id: currentID })
  }
});

app.get('/getDocs', async (req, res) => {
  const docs = await getAllDocs();
  res.json(docs);
});

app.get('/getLastTheme', async (req, res) => {
  res.json({ theme: applyedTheme })
});

//Is das ein sicherheitsrisiko wenn man einfach den body einer anfrage nimmt und settet?
app.post('/setAppliedTheme', async (req, res) => {
  const data = req.body
  applyedTheme = data.theme
  res.json({ success: true })
})

app.post('/getDoc', async (req, res) => {
  const data = req.body
  const doc = await getDoc(data.category, data.docName)
  res.json({ theme: doc })
})

app.post('/deleteDatabaseEntries', async (req, res) => {
  try {
    await deleteEverything();
    res.status(200).json({ message: 'All entries deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting entries', error });
  }
});

app.post('/deleteDoc', async (req, res) => {
  const data = req.body
  const doc = await deleteDoc(data.category, data.docName)
  res.json({ success: true })
});

app.post('/deleteID', async (req, res) => {
  const data = req.body
  const doc = await deleteID(data.category)
  res.json({ success: true })
});

app.listen(PORT, () => {
  console.log(`AI Backend Server running on port ${PORT}`);
});

export default generateAIPrompt;
