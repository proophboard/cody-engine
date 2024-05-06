// Backend Data importieren
import { askAI } from './AI.js'

export async function makePrompt(prompt){

    
    const finishedPrompt = {
        messages: [
          { role: 'system', content: 'GENERATE ONLY HTML/CSS and nothing else: Based on the following information, format the response using only HTML with inline CSS:' },
          { role: 'user', content: "Mache eine website von einem Annanasverkäufer!" }
        ],
        model: 'llama3:latest',
      }

      //Evt mehrere Prompts generieren und mehrere male die AI etwas bauen lassen?
      
      const response = await askAI(finishedPrompt) 
      

      //Das ist nur für testzwecke da wir ja noch mit dem bootleg Frontend arbeiten 06.05.2024
      return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chat Result</title>
      </head>
      <body>
        <h1>Chat Result</h1>
        <p>${response.choices[0].message.content}</p>
      </body>
      </html>`;

}