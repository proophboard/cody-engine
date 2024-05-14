// Generiert einen prompt aus den User-Präferenzen und gibt diesen als JSON zurück
function generateAIPrompt(preferences) {
    return JSON.stringify({
        messages: [
            { role: 'system', content: 'You are an AI designed to generate MUI theme configurations from scratch. Based on the given user preferences, create a complete and valid JSON configuration in the format of a MUI theme. Ensure all fields are filled out based on the user preferences.' },
            { role: 'user', content: `User preferences: ${JSON.stringify(preferences, null, 2)}` },
            { role: 'user', content: 'Please generate a complete MUI theme configuration JSON based on the provided preferences. Ensure the JSON is wrapped in a markdown code block (```json ... ```), without any additional text before or after the code block, and is valid according to standard JSON parsing. Use the following structure and customize it according to the preferences. Ensure no fields are left empty or with placeholder values.' },
            { role: 'user', content: `
\`\`\`json
{
  "palette": {
    "mode": "light",
    "primary": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "secondary": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "error": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "warning": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "info": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "success": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    }
  },
  "typography": {
    "htmlFontSize": 16,
    "fontFamily": "Arial, Helvetica, sans-serif",
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500,
    "fontWeightBold": 700
  },
  "shape": {
    "borderRadius": 4
  }
}
\`\`\`
` },
            { role: 'user', content: 'Return only the JSON code block. Do not include any additional text or explanations. Ensure all fields are filled in.' }
        ]
    });
}

function generateFixAIPrompt(previousResponse) {
    return JSON.stringify({
        messages: [
            { role: 'system', content: 'The previous response contained invalid JSON. Please correct the JSON and provide a valid MUI theme configuration.' },
            { role: 'user', content: `Previous response: ${previousResponse}` },
            { role: 'user', content: 'Please correct the JSON and ensure it aligns with the user preferences provided earlier. Ensure the JSON is wrapped in a markdown code block (```json ... ```), without any additional text before or after the code block, and is valid according to standard JSON parsing. Use the following structure and customize it according to the preferences. Ensure no fields are left empty or with placeholder values.' },
            { role: 'user', content: `
\`\`\`json
{
  "palette": {
    "mode": "light",
    "primary": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "secondary": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "error": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "warning": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "info": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    },
    "success": {
      "main": "",
      "light": "",
      "dark": "",
      "contrastText": ""
    }
  },
  "typography": {
    "htmlFontSize": 16,
    "fontFamily": "Arial, Helvetica, sans-serif",
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500,
    "fontWeightBold": 700
  },
  "shape": {
    "borderRadius": 4
  }
}
\`\`\`
` },
            { role: 'user', content: 'Return only the JSON code block. Do not include any additional text or explanations. Ensure all fields are filled in.' }
        ]
    });
}

export { generateAIPrompt, generateFixAIPrompt };
