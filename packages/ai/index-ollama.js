const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require('openai');

const app = express();

const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('dotenv').config();

const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1/',
  apiKey: 'ollama'
});

app.post("/converse", async (req, res) => {
  const message = req.body.message;

  if (!message) {
    return res.status(400).send("Error: message is required");
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'GENERATE ONLY HTML/CSS and nothing else: Based on the following information, format the response using only HTML with inline CSS:' },
        { role: 'user', content: message }
      ],
      model: 'llama3:latest',
    });

    if (!chatCompletion.choices) {
      console.error(chatCompletion);
      return res.status(500).send("Error: Ollama API request failed");
    }

    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chat Result</title>
      </head>
      <body>
        <h1>Chat Result</h1>
        <p>${chatCompletion.choices[0].message.content}</p>
      </body>
      </html>
    `;

    res.send(htmlResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing your request: " + error.message);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
