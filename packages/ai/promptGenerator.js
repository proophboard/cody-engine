function generateAIPrompt(preferences) {
    console.log('User preferences:', preferences)
    return JSON.stringify({
        messages: [
            { role: 'system', content: 'You are an AI designed to generate MUI theme configurations from scratch. Based on the given user preferences, create a complete and valid JSON configuration in the format of a MUI theme. Ensure all fields are filled out based on the user preferences.' },
            { role: 'user', content: `User preferences: ${JSON.stringify(preferences, null, 2)}    Remember, sharp means low borderRadius and rounded means high borderRadius. also the vibe determines the font as well.` },
            { role: 'user', content: 'Please generate a complete MUI theme configuration JSON based on the provided preferences. Ensure the JSON is wrapped in a markdown code block (```json ... ```), without any additional text before or after the code block, and is valid according to standard JSON parsing. Use the following structure and customize it according to the preferences.' },
            { role: 'user', content: 'Ensure no fields are left empty or with placeholder values. In the primary as well in the secondary color as well. For example, use the preferred accent color for the primary color palette.'},
            { role: 'user', content: `Modern means high borderRadius and Classic means low borderRadius, so SHARP Corners. Professional means low borderRadius and Casual means high borderRadius. modern has a vibe of sans-serif and classic has a vibe of serif. professional has a vibe of monospace and casual has a vibe of cursive. Never turn the background-color black-ish. Keep it light and easy on the eyes.`},
            { role: 'user', content: `
\`\`\`json
{
    "palette": {
      "primary": {
        "main": "",
        "light": "",
        "dark": "",
        "contrastText": ""
      },
      "background": {
        "default": "",
        "paper": ""
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
      "borderRadius": 0
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
            { role: 'user', content: 'Please correct the JSON and ensure it aligns with the user preferences provided earlier. Ensure the JSON is wrapped in a markdown code block (```json ... ```), without any additional text before or after the code block, and is valid according to standard JSON parsing. Use the following structure and customize it according to the preferences. Ensure no fields are left empty or with placeholder values. For example, use the preferred color for the primary color palette.' },
            { role: 'user', content: `
\`\`\`json
{
    "palette": {
      "primary": {
        "main": "",
        "light": "",
        "dark": "",
        "contrastText": ""
      },
      "background": {
        "default": "",
        "paper": ""
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
      "borderRadius": 0 
    }
  }
\`\`\`
` },
            { role: 'user', content: 'Return only the JSON code block. Do not include any additional text or explanations. Ensure all fields are filled in.' }
        ]
    });
}

export { generateAIPrompt, generateFixAIPrompt };
