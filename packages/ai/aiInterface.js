import OpenAI from 'openai';
import dotenv from 'dotenv';

// Laden der Umgebungsvariablen
dotenv.config();

// Erstellen einer neuen OpenAI-Instanz
const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1/',
    apiKey: 'obama', 
});

// Funktion zum Senden einer Anfrage an die KI
export async function askAI(AIprompt) {
    console.log("Rufe KI auf...");
    try {
        // Erstellen und Senden der Anfrage
        const response = await openai.chat.completions.create({
            model: "llama3",
            messages: [
                { role: 'user', content: AIprompt }
            ],
            temperature: 0.7,
            max_tokens: 8000,
        });
        // Ausgabe der KI-Antwort
        console.log("KI-Antwort:", response.choices[0].message.content);
        // Rückgabe der KI-Antwort
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Fehler in der KI-Schnittstelle:', error);
        throw new Error('KI-Anfrage fehlgeschlagen');
    }
}