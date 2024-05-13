import express from 'express';
import { askAI } from './aiInterface.js';
import cors from 'cors';

const app = express();
const PORT = 3000;

let storedThemeConfig = {};

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.post('/api/generate-with-ai', async (req, res) => {
    const AIprompt = JSON.stringify({
        messages: [
            { role: 'system', content: 'Generate a Material-UI theme configuration based on user input.' },
            { role: 'user', content: req.body.preferences } 
        ],
        model: 'llama3',
    });

    try {
        const response = await askAI(AIprompt);
        storedThemeConfig = response;
        console.log('AI Response:', response);
        res.json({ success: true }); 
    } catch (error) {
        console.error('AI Request failed:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/api/theme-config', (req, res) => {
    console.log('Received request for theme config');
    if (Object.keys(storedThemeConfig).length > 0) {
        res.json(storedThemeConfig);
    } else {
        res.status(404).send('No theme configuration available');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
