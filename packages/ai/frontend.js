import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Statische Dateien aus dem "src"-Ordner hosten
app.use(express.static(path.join(__dirname, 'src')));

// Route für die index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(6010, () => {
  console.log("AI Frontend Server is running on port 6010");
});
