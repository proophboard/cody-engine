import express from 'express';
import { askAI } from './aiInterface.js';
import cors from 'cors';

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
    // Erstellen des KI-Prompts
    const AIprompt = JSON.stringify({
        messages: [
            { role: 'system', content: 'Generate a Material-UI theme configuration based on user input.' },
            { role: 'user', content: req.body.preferences } 
        ],
        model: 'llama3',
    });

    try {
        // Anfrage an die KI senden und Antwort speichern
        const response = await askAI(AIprompt);
        storedThemeConfig = response;
        console.log('AI Response:', response);
        res.json({ success: true }); 
    } catch (error) {
        console.error('AI Request failed:', error);
        res.status(500).send('Server Error');
    }
});

// Route zum Abrufen der gespeicherten Theme-Konfiguration
app.get('/api/theme-config', (req, res) => {
    console.log('Received request for theme config');
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