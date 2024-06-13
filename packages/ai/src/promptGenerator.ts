const jsonCode = `
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
    "contrastThreshold": 3,
    "tonalOffset": 0.2,
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
  "components": {
    "MuiBox": {
      "styleOverrides": {
        "root": {
          "display": "flex",
          "flexDirection": "column",
          "alignItems": "center",
          "justifyContent": "center"
        }
      }
    },
    "MuiDataGrid": {
      "styleOverrides": {
        "root": {
          "display": "flex",
          "flexDirection": "column"
        },
        "toolbar": {
          "display": "flex",
          "justifyContent": "space-between"
        }
      }
    },
    "MuiGrid": {
      "styleOverrides": {
        "root": {
          "display": "flex"
        },
        "container": {
          "display": "flex",
          "justifyContent": "center",
          "alignItems": "center",
          "flexDirection": "column-reverse",
          "flexWrap": "wrap"
        },
        "item": {
          "display": "flex",
          "flexDirection": "row",
          "alignItems": "center",
          "justifyContent": "center"
        }
      }
    }
  }
}

`;


function generateAIPrompt(preferences: any, previousResponse?: string | null) {
  console.log('User preferences:\n', preferences)
  return JSON.stringify({
    messages: [
      { role: 'system', content: 'You are an AI designed to generate MUI theme configurations based on a given template. Change the given template and generate a new MUI theme configuration. Never leave the default options or empty strings or null and never leave any placeholders. Everything should be filled out in a way that makes sense and with good UI/UX' },
      { role: 'user', content: `User preferences: ${JSON.stringify(preferences, null, 2)}`},
      { role: 'user', content: `${jsonCode}` },
      { role: 'user', content: 'Ensure all fields are filled in and more importantly: changed according to the user preferences.' }
    ]
  });
}

export { generateAIPrompt };
