//Hier wird  der Prompt gemeinsam mit den Backend Daten ausgewertet. 
import { askAI } from './AI.js'

//prompt: Die Informationen die der Nutzer im Frontend gegeben hat
//return: Die Antwort der KI.
export async function modifyPrompt(prompt){

    
    const finishedPrompt = {
        messages: [
          { role: 'system', content: 'GENERATE ONLY HTML/CSS and nothing else: Based on the following information, format the response using only HTML with inline CSS:' },
          { role: 'user', content: "Mach eine Weihnachtsen themend seite mit html und inline css auf der verschiedenen weihnachtliche dinge verkauft werden. Denk dir gerne noch weitere features für die Seite aus und mach Sie interessant!." }
        ],
        model: 'llama3:latest',
      }

      //Evt mehrere Prompts generieren und mehrere male die AI etwas bauen lassen?
      console.log("Fragt KI");
      const response = await askAI(finishedPrompt) 
      console.log("KI hat aw");

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

export async function modifyPromptTestAI(prompt){

    
  const finishedPrompt = {
      messages: [
        { role: 'system', content: 'GENERATE ONLY HTML/CSS and nothing else: Based on the following information, format the response using only HTML with inline CSS:' },
        { role: 'user', content: prompt }
      ],
      model: 'llama3:latest',
    }

    //Evt mehrere Prompts generieren und mehrere male die AI etwas bauen lassen?
    console.log("Fragt KI");
    const response = await askAI(finishedPrompt) 
    console.log("KI hat aw");

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