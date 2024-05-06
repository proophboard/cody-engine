//Diese Datei ist der Main controller von hier wird alles gemanaget. Siehe Prooph board.
import { modifyPrompt } from './modifyPrompt.js'
import { modifyPromptTestAI } from './modifyPrompt.js'
import { pushUIDataTestAI } from './pushUiData.js'
import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Hier werden die Daten die im JSON format ankommen weiterverarbeitet.
app.post("/generate-with-ai", async (req, res) => {
  const message = req.body.message;
  console.log("1");
  if (!message) {
    return res.status(400).send("Error: message is required");
  }

  //ist let usen sussy?
  let response;
  try {
    //Hier wird die Nachricht im Body an ModifyPrompt geschickt. (Muss noch verändert werden, da der Body gerade aus nur einem String
    //aus dem bootleg Frontend besteht 06.05.2024)
    console.log("Schickt in mod prompt")
    response = await modifyPrompt(message) 
    console.log("Kommt aus mod prompt") }
  catch (error) {
    console.error(error);
    res.status(500).send("Error processing your request: " + error.message);
  }

  //Hier wird die Data in die pushUiData klasse geschickt, sodass sie dort ins Frontend übergeben werden kann.
  console.log("Schickt in pushUI")
  pushUIDataTestAI(response);
  console.log("Kommt aus pushUI")
  res.status(200).send();

});

//Schickt den Promt so wie er ist an die AI (der fließtext promt aus Himayats Prototypen)
app.post("/test-ai", async (req, res) => {
  const message = req.body.message;
  if (!message) {
    return res.status(400).send("Error: message is required");
  }
  //ist let usen sussy?
  let response;
  try {
    //Hier wird die Nachricht im Body an ModifyPrompt geschickt. (Muss noch verändert werden, da der Body gerade aus nur einem String
    //aus dem bootleg Frontend besteht 06.05.2024)
    console.log("HELP Schickt in mod prompt")
    response = await modifyPromptTestAI(message) 
    console.log("HELP Kommt aus mod prompt") }
  catch (error) {
    console.error(error);
    res.status(500).send("Error processing your request: " + error.message);
  }

  //Hier wird die Data in die pushUiData klasse geschickt, sodass sie dort ins Frontend übergeben werden kann.
  res.send(response);

});

app.listen(3000, () => {
  console.log("AI Backend Server is running on port 3000");
});
