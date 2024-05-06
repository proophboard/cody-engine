//Diese Datei ist der Main controller von hier wird alles gemanaget. Siehe Prooph board.
import { makePrompt } from './modifyPrompt.js'
import { pushUIDataDummy } from './pushUiData.js'
import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post("/converse", async (req, res) => {
  const message = req.body.message;
  
  if (!message) {
    return res.status(400).send("Error: message is required");
  }

  //ist let usen sussy?
  let response;
  try {
    //Hier wird die Nachricht im Body an ModifyPrompt geschickt. (Muss noch verändert werden, da der Body gerade aus nur einem String
    //aus dem bootleg Frontend besteht 06.05.2024)
    response = await makePrompt(message) } 
  
  catch (error) {
    console.error(error);
    res.status(500).send("Error processing your request: " + error.message);
  }

  //Hier wird die Data in die pushUiData klasse geschickt, sodass sie dort ins Frontend übergeben werden kann.
  pushUIDataDummy(response, res)

});

app.listen(3000, () => {
  console.log("AI Backend Server is running on port 3000");
});
