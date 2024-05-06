import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';

//Diese Datei braucht man nur um sich selbst im Frontend die KI ausgabe zu visualisieren

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Statische Dateien aus dem "src"-Ordner hosten
app.use(express.static(path.join(__dirname, 'src')));
app.use(bodyParser.json());

// Route für die index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

let lastMessage = ""; // Speichert die zuletzt empfangene Nachricht (schon entpackt also nicht die json)

//Durch diese Methode wird die message im body der request in "lastMessage" gespeichert.
app.post('/save', (req, res) => {
  const message = req.body.message;
  
  if (!message) {
    return res.status(400).send("Error: message is required");
  }

  lastMessage = message; // Speichert die zuletzt empfangene Nachricht
  res.sendStatus(200);
});

//getter für "lastMessage"
app.get('/getLastMessage', (req, res) => {
  res.send(lastMessage);
});

app.listen(6010, () => {
  console.log("AI Frontend Server is running on port 6010");
});
