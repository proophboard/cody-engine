import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    baseURL: 'http://localhost:11434/v1/',
    apiKey: 'obama', 
});

export async function askAI(AIprompt) {
    console.log("Calling AI...");
    try {
        const response = await openai.chat.completions.create({
            model: "llama3",
            messages: [
                { role: 'user', content: AIprompt }
            ],
            temperature: 0.7,
            max_tokens: 8000,
        });
        console.log("AI Response:", response.choices[0].message.content);
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error in AI Interface:', error);
        throw new Error('AI Request Failed');
    }
}
