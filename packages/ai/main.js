import express from 'express';
import { askAI } from './aiInterface.js';
import cors from 'cors';
import { generateAIPrompt, generateFixAIPrompt } from './promptGenerator.js';

// Erstellen einer neuen Express-Anwendung
const app = express();
const PORT = 3000;

// Speichern der Theme-Konfiguration
let storedThemeConfig = {};

// CORS und JSON Middleware verwenden
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Helper Funktion zum Überprüfen, ob ein String ein gültiges JSON ist
function isValidJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return !!parsed && typeof parsed === 'object';
  } catch (e) {
    return false;
  }
}

// Funktion um die KI-Anfrage zu wiederholen, falls die Antwort nicht den Anforderungen entspricht
async function retryAskAI(AIprompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await askAI(AIprompt);
      console.log(`AI Response Attempt ${attempt}: ${response}`);

      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || response.match(/```(?:\s*([\s\S]*?)\s*)```/);

      if (jsonMatch && jsonMatch[1]) {
        const extractedJSON = jsonMatch[1].trim();
        console.log(`Extracted JSON: ${extractedJSON}`);

        if (isValidJSON(extractedJSON)) {
          const jsonResponse = JSON.parse(extractedJSON);
          console.log(`Valid JSON found on attempt ${attempt}`);
          return jsonResponse;
        } else {
          console.warn(`Attempt ${attempt} failed: Extracted JSON is invalid.`);
          AIprompt = generateFixAIPrompt(response);
        }
      } else {
        console.warn(`Attempt ${attempt} failed: No JSON code block found.`);
        AIprompt = generateFixAIPrompt(response);
      }
    } catch (error) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      AIprompt = generateFixAIPrompt(error.message);
    }
  }
  throw new Error('All attempts to get a valid AI response failed.');
}

// Endpunkt zum Generieren einer Theme-Konfiguration mit KI
app.post('/api/generate-with-ai', async (req, res) => {
  const userPreferences = req.body.preferences;
  let AIprompt = generateAIPrompt(userPreferences);

  try {
    storedThemeConfig = await retryAskAI(AIprompt);
    res.json({ success: true, theme: storedThemeConfig });
  } catch (error) {
    console.error('AI Request failed:', error);

    res.status(500).json({
      success: false,
      message: 'AI Request failed. Unable to generate theme configuration.',
    });
  }
});

app.get('/api/theme-config', (req, res) => {
  if (Object.keys(storedThemeConfig).length > 0) {
    res.json(storedThemeConfig);
  } else {
    res.status(404).send('No theme configuration available');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default generateAIPrompt;
