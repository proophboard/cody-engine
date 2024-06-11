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
export async function askAI(AIprompt: string, aiSource: string) {
    console.log("Rufe KI auf...");
    let response;
    let errormessage;
    try {
        switch(aiSource){
            case ("local"):
                errormessage = "Lokalen KI Anfrage"
                // Erstellen und Senden der Anfrage
                response = await openai.chat.completions.create({
                    model: "llama3",
                    response_format: { "type": "json_object" },
                    messages: JSON.parse(AIprompt).messages,
                    temperature: 0.7,
                    max_tokens: 8000,
                });
                return response.choices[0].message.content;
            case ("server"):
                errormessage = "Server KI Anfrage"
                //TODO Hier kommt die logik hin die AI auf dem bitexpert server aufzurufen.
                response = {choices : [{message : {content : "Das is nur hier weil sonst ein error kommt"} }] };
                return response.choices[0].message.content;
            default:
                throw new Error("Fehler im aiInterface. Die es wurde weder local noch server ausgewählt")
        }
        // Rückgabe der KI-Antwort
    } catch (error) {
        console.error(`Fehler in der KI-Schnittstelle (${errormessage}) :`, error);
        throw new Error('KI-Anfrage fehlgeschlagen');
    }
}