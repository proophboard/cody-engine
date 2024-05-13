import express from 'express';
import { askAI } from './aiInterface.js';
import cors from 'cors';
import generateAIPrompt from './promptGenerator.js';

// Erstellen einer neuen Express-Anwendung
const app = express();
const PORT = 3000;

// Speichern der Theme-Konfiguration
let storedThemeConfig = {};

// CORS und JSON Middleware verwenden
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Route zum Generieren der Theme-Konfiguration mit KI
app.post('/api/generate-with-ai', async (req, res) => {
    const AIprompt = generateAIPrompt(req.body.preferences);

    try {
        // Anfrage an die KI senden und Antwort speichern
        const response = await askAI(AIprompt);
        storedThemeConfig = response;
        res.json({ success: true }); 
    } catch (error) {
        console.error('AI Request failed:', error);
        res.status(500).send('Server Error');
    }
});

// Route zum Abrufen der gespeicherten Theme-Konfiguration
app.get('/api/theme-config', (req, res) => {
    if (Object.keys(storedThemeConfig).length > 0) {
        // Wenn eine Konfiguration vorhanden ist, sende sie zurück
        res.json(storedThemeConfig);
    } else {
        res.status(404).send('No theme configuration available');
    }
});

// Starten des Servers
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});