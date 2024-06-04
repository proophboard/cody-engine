function generateAIPrompt(preferences: any) {
    console.log('User preferences:', preferences)
    return JSON.stringify({
        messages: [
            { role: 'system', content: 'You are an AI designed to generate MUI theme configurations from scratch. Based on the given user preferences, create a complete and valid JSON configuration in the format of a MUI theme. Ensure all fields are filled out based on the user preferences. **Dont leave any strings empty** NEVER LEAVE THEM EMPTY like this "". Always fill it with information based on the user preferences. Dont change the Json in its structure, just change its content/the strings. also when you enter colors of text or any other color, **always** use the hex code and never leave it empty. You take in information from the User input, interpret it, decide for a certain theme that fits with the user preferences and also with general UI/UX guidelines and then apply this theme onto the MUI theme config json' },
            { role: 'user', content: `User preferences: ${JSON.stringify(preferences, null, 2)}   Please generate a complete MUI theme configuration JSON based on the provided preferences. Change as much as possible, dont input something invalid. Think before you generate, make the generated JSON distinct in its content. The textcolor must be something in contrast to the background-colors. dont forget that. Spacing should never be extremely high or much lower than the default. dont overexaggerate. also try to **coordinate** the colors and everything so that it is in harmony with each other. Primary and secondary color should never be the same. (Change spacing minimally). The Weight of the color should define how important it is for the ai to adhere to the color given in the user preference. if its 0%, the ai can do whatever it wants, as long as it meets the criteria of ui/ux designing guidelines and is in harmony. also 100% means that it should stick to that color 100% and can vary a little bit. this doesnt affect the background color. Dont forget to change the font depending on the type of theme chosen in the user preferences for the font. (NEVER LEAVE ANY STRINGS EMPTY NEVER LEAVE ANY STRINGS EMPTY) (Also the colors should never be 100% the same. they can be shades of one color, but not the same same) (NEVER TURN THE BACKGROUND TO BLACK OR TRY TO MAKE A DARK MODE OR SOMETHING)` },
            { role: 'user', content: `
\`\`\`json
{
  "palette": {
    "primary": {
      "main": "#3f51b5",
      "light": "#757de8",
      "dark": "#002984",
      "contrastText": "#ffffff"
    },
    "secondary": {
      "main": "#f50057",
      "light": "#ff5983",
      "dark": "#bb002f",
      "contrastText": "#ffffff"
    },
    "error": {
      "main": "#f44336",
      "light": "#e57373",
      "dark": "#d32f2f",
      "contrastText": "#ffffff"
    },
    "warning": {
      "main": "#ff9800",
      "light": "#ffb74d",
      "dark": "#f57c00",
      "contrastText": "#000000"
    },
    "info": {
      "main": "#2196f3",
      "light": "#64b5f6",
      "dark": "#1976d2",
      "contrastText": "#ffffff"
    },
    "success": {
      "main": "#4caf50",
      "light": "#81c784",
      "dark": "#388e3c",
      "contrastText": "#ffffff"
    },
    "grey": {
      "50": "#fafafa",
      "100": "#f5f5f5",
      "200": "#eeeeee",
      "300": "#e0e0e0",
      "400": "#bdbdbd",
      "500": "#9e9e9e",
      "600": "#757575",
      "700": "#616161",
      "800": "#424242",
      "900": "#212121"
    },
    "contrastThreshold": 3,
    "tonalOffset": 0.2,
    "divider": "#bdbdbd",
    "background": {
      "default": "#ffffff",
      "paper": "#f5f5f5"
    },
    "action": {
      "active": "#212121",
      "hover": "#e0e0e0",
      "hoverOpacity": 0.08,
      "selected": "#e0e0e0",
      "selectedOpacity": 0.08,
      "disabled": "#bdbdbd",
      "disabledBackground": "#e0e0e0",
      "disabledOpacity": 0.38,
      "focus": "#e0e0e0",
      "focusOpacity": 0.12,
      "activatedOpacity": 0.12
    },
  },
  "spacing": 10,
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
            { role: 'user', content: 'Ensure all fields are filled in and more importantly: changed according to the user preferences.' }
        ]
    });
}

function generateFixAIPrompt(previousResponse: string | null, preferences?: any) {
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
      "main": "#3f51b5",
      "light": "#757de8",
      "dark": "#002984",
      "contrastText": "#ffffff"
    },
    "secondary": {
      "main": "#f50057",
      "light": "#ff5983",
      "dark": "#bb002f",
      "contrastText": "#ffffff"
    },
    "error": {
      "main": "#f44336",
      "light": "#e57373",
      "dark": "#d32f2f",
      "contrastText": "#ffffff"
    },
    "warning": {
      "main": "#ff9800",
      "light": "#ffb74d",
      "dark": "#f57c00",
      "contrastText": "#000000"
    },
    "info": {
      "main": "#2196f3",
      "light": "#64b5f6",
      "dark": "#1976d2",
      "contrastText": "#ffffff"
    },
    "success": {
      "main": "#4caf50",
      "light": "#81c784",
      "dark": "#388e3c",
      "contrastText": "#ffffff"
    },
    "grey": {
      "50": "#fafafa",
      "100": "#f5f5f5",
      "200": "#eeeeee",
      "300": "#e0e0e0",
      "400": "#bdbdbd",
      "500": "#9e9e9e",
      "600": "#757575",
      "700": "#616161",
      "800": "#424242",
      "900": "#212121"
    },
    "contrastThreshold": 3,
    "tonalOffset": 0.2,
    "divider": "#bdbdbd",
    "background": {
      "default": "#ffffff",
      "paper": "#f5f5f5"
    },
    "action": {
      "active": "#212121",
      "hover": "#e0e0e0",
      "hoverOpacity": 0.08,
      "selected": "#e0e0e0",
      "selectedOpacity": 0.08,
      "disabled": "#bdbdbd",
      "disabledBackground": "#e0e0e0",
      "disabledOpacity": 0.38,
      "focus": "#e0e0e0",
      "focusOpacity": 0.12,
      "activatedOpacity": 0.12
    },
  },
  "spacing": 10,
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

function checkAndRegenerateJSON(previousResponse: any, preferences: any) {
  return JSON.stringify({
      messages: [
        { role: 'system', content: 'You are an AI designed to generate MUI theme configurations from scratch. Based on the given user preferences, create a complete and valid JSON configuration in the format of a MUI theme. Ensure all fields are filled out based on the user preferences. **Dont leave any strings empty** NEVER LEAVE THEM EMPTY like this "". Always fill it with information based on the user preferences. Dont change the Json in its structure, just change its content/the strings. also when you enter colors of text or any other color, **always** use the hex code and never leave it empty. You take in information from the User input, interpret it, decide for a certain theme that fits with the user preferences and also with general UI/UX guidelines and then apply this theme onto the MUI theme config json' },
        { role: 'user', content: `User preferences: ${JSON.stringify(preferences, null, 2)}   Please generate a complete MUI theme configuration JSON based on the provided preferences. Change as much as possible, dont input something invalid. Think before you generate, make the generated JSON distinct in its content. The textcolor must be something in contrast to the background-colors. dont forget that. Spacing should never be extremely high or much lower than the default. dont overexaggerate. also try to **coordinate** the colors and everything so that it is in harmony with each other. Primary and secondary color should never be the same. (Change spacing minimally). The Weight of the color should define how important it is for the ai to adhere to the color given in the user preference. if its 0%, the ai can do whatever it wants, as long as it meets the criteria of ui/ux designing guidelines and is in harmony. also 100% means that it should stick to that color 100% and can vary a little bit. this doesnt affect the background color. Dont forget to change the font depending on the type of theme chosen in the user preferences for the font. (NEVER LEAVE ANY STRINGS EMPTY NEVER LEAVE ANY STRINGS EMPTY)` },
          { role: 'user', content: `Previous response: ${previousResponse}` },
          { role: 'user', content: `
\`\`\`json
{
  "palette": {
    "primary": {
      "main": "#3f51b5",
      "light": "#757de8",
      "dark": "#002984",
      "contrastText": "#ffffff"
    },
    "secondary": {
      "main": "#f50057",
      "light": "#ff5983",
      "dark": "#bb002f",
      "contrastText": "#ffffff"
    },
    "error": {
      "main": "#f44336",
      "light": "#e57373",
      "dark": "#d32f2f",
      "contrastText": "#ffffff"
    },
    "warning": {
      "main": "#ff9800",
      "light": "#ffb74d",
      "dark": "#f57c00",
      "contrastText": "#000000"
    },
    "info": {
      "main": "#2196f3",
      "light": "#64b5f6",
      "dark": "#1976d2",
      "contrastText": "#ffffff"
    },
    "success": {
      "main": "#4caf50",
      "light": "#81c784",
      "dark": "#388e3c",
      "contrastText": "#ffffff"
    },
    "grey": {
      "50": "#fafafa",
      "100": "#f5f5f5",
      "200": "#eeeeee",
      "300": "#e0e0e0",
      "400": "#bdbdbd",
      "500": "#9e9e9e",
      "600": "#757575",
      "700": "#616161",
      "800": "#424242",
      "900": "#212121"
    },
    "contrastThreshold": 3,
    "tonalOffset": 0.2,
    "divider": "#bdbdbd",
    "background": {
      "default": "#ffffff",
      "paper": "#f5f5f5"
    },
    "action": {
      "active": "#212121",
      "hover": "#e0e0e0",
      "hoverOpacity": 0.08,
      "selected": "#e0e0e0",
      "selectedOpacity": 0.08,
      "disabled": "#bdbdbd",
      "disabledBackground": "#e0e0e0",
      "disabledOpacity": 0.38,
      "focus": "#e0e0e0",
      "focusOpacity": 0.12,
      "activatedOpacity": 0.12
    },
  },
  "spacing": 10,
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
          { role: 'user', content: 'Ensure all fields are filled in and more importantly: changed according to the user preferences.' }
      ]
  });
}

export { generateAIPrompt, generateFixAIPrompt, checkAndRegenerateJSON};
