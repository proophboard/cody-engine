import OpenAI from 'openai';
import dotenv from 'dotenv';

// Laden der Umgebungsvariablen
dotenv.config();

// Erstellen einer neuen OpenAI-Instanz
const openai = new OpenAI({
    baseURL: 'https://f4359ba8-80fc-455d-a8e6-fad069f30239.app.gra.ai.cloud.ovh.net/v1',
    apiKey: 'Cj/12wYGQPW+V5DMteAybJEQtXAhf6iZxUK6BoBsy4avYaJgQ9E3RzbtUSRdcxjr', 
});

// Funktion zum Senden einer Anfrage an die KI
export async function askAI(AIprompt: string, temperature: number) {
    console.log("Rufe KI auf...");
    console.log("temperature: ", temperature);
    try {
        // Erstellen und Senden der Anfrage
        const response = await openai.chat.completions.create({
            model: "codestral",
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