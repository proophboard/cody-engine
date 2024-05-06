//Diese Datei ist die schnittstelle zur AI. Hier wird gemanaget welche AI angesprochen wird.

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();


const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1/',
    apiKey: 'ollama'
  });


export async function askAI(AIprompt) {

    const response = await openai.chat.completions.create(AIprompt);

    if (!response.choices) {
      console.error(response);
      return res.status(500).send("Error: Ollama API request failed");
    }

    return response;
  
}
