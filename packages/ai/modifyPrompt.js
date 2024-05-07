//Hier wird  der Prompt gemeinsam mit den Backend Daten ausgewertet. 
import { askAI } from './AI.js'

//prompt: Die Informationen die der Nutzer im Frontend gegeben hat
//return: Die Antwort der KI.
export async function modifyPrompt(prompt){

    
    const finishedPrompt = {
      messages: [
          //old system prompt: GENERATE ONLY HTML/CSS and nothing else: Based on the following information, format the response using only HTML with inline CSS: 
          { role: 'system', content: `GENERATE ONLY HTML WITH INLINE CSS. Everything you answer will be put in the div tag of the body. Base your output on the following description and use only html with inline css:
          <!DOCTYPE html>
          <html>
          <head>
            <title>Chat Result</title>
          </head>
          <body>
            <div></div>
          </body>
          </html>` },
          { role: 'user', content: `In the following sentences you will always get a Question and an answer for it. Based on the  answers, create a big creative, interactive, userfriendly website ${prompt[1].question}  ${prompt[1].answer}.  ${prompt[2].question}  ${prompt[2].answer}.  ${prompt[3].question}  ${prompt[3].answer}.  ${prompt[4].question}  ${prompt[4].answer}`  }
        ],
        model: 'llama3:latest',
      }
      console.log("Finished Prompt:")
      console.log(finishedPrompt);
      //Evt mehrere Prompts generieren und mehrere male die AI etwas bauen lassen?
      console.log("Fragt KI");
      const response = await askAI(finishedPrompt) 
      console.log("KI hat aw:");
      console.log(response.choices[0].message.content)
      //Das ist nur für testzwecke da wir ja noch mit dem bootleg Frontend arbeiten 06.05.2024
      
      const regex = /^```[\s\S]*?```$/gm;
      const cleanedResponse = response.choices[0].message.content.replace(regex, '');
      console.log("Cleaned Response:");
      console.log(cleanedResponse)
      
      return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chat Result</title>
      </head>
      <body>
        <div>${cleanedResponse}</div>
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