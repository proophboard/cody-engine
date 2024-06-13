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
export async function askAI(AIprompt: string, temperature: number) {
    console.log("Rufe KI auf...");
    console.log("temperature: ", temperature);
    try {
        // Erstellen und Senden der Anfrage
        const response = await openai.chat.completions.create({
            model: "llama3",
            response_format: { "type": "json_object" },
            messages: JSON.parse(AIprompt).messages,
            temperature: temperature,
            max_tokens: 8000,
        });
        // Rückgabe der KI-Antwort
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Fehler in der KI-Schnittstelle:', error);
        throw new Error('KI-Anfrage fehlgeschlagen');
    }
}