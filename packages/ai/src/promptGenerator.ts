const jsonCode = `
{
  "palette": {
    "mode": "light",
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
    "background": {
      "default": "#ffffff",
      "paper": "#f5f5f5"
    },
    "text": {
      "primary": "#000000",
      "secondary": "#212121"
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
    }
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
    "borderRadius": 4
  },
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
    },
    "MuiGrid2": {
      "styleOverrides": {
        "root": {
          "flexDirection": "row-reverse",
          "justifyContent": "space-between",
          "alignItems": "flex-start"
        }
      }
    },
    "MuiContainer": {
      "styleOverrides": {
        "root": {
          "display": "flex",
          "flexDirection": "column",
          "padding": "16px",
          "margin": "0 auto",
          "maxWidth": "1200px"
        }
      }
    },
    "MuiPaper": {
      "styleOverrides": {
        "root": {
          "display": "flex",
          "flexDirection": "column",
          "padding": "16px",
          "margin": "16px",
          "boxShadow": "0 4px 8px rgba(0, 0, 0, 0.1)"
        }
      }
    },
    "MuiCard": {
      "styleOverrides": {
        "root": {
          "display": "flex",
          "flexDirection": "column",
          "padding": "16px",
          "margin": "16px",
          "boxShadow": "0 4px 8px rgba(0, 0, 0, 0.1)",
          "borderRadius": "8px"
        }
      }
    },
    "MuiCardActions": {
      "styleOverrides": {
        "root": {
          "display": "flex",
          "justifyContent": "flex-end"
        }
      }
    },
    "MuiCardContent": {
      "styleOverrides": {
        "root": {
          "display": "flex",
          "flexDirection": "column",
          "alignItems": "center"
        }
      }
    }
  }
}`;

interface Preference {
  question: string;
  answer: string;
}

interface Preferences {
  [key: string]: Preference;
}

const fontMapping: { [key: string]: string[] } = {
  playful: ['Pacifico', 'Baloo 2', 'Caveat'],
  simple: ['Open Sans', 'Lato', 'Montserrat'],
  mechanical: ['Roboto Mono', 'Source Code Pro', 'Fira Code'],
  rounded: ['Nunito', 'Quicksand', 'Comic Neue'],
  elegant: ['Playfair Display', 'Merriweather', 'Abril Fatface'],
  dramatic: ['Bebas Neue', 'Righteous', 'Bungee'],
  factual: ['Roboto', 'Inter', 'Ubuntu']
};

const themeMapping: { [key: string]: string } = {
  'Serious': 'serious and professional',
  'Energetic': 'energetic and vibrant',
  'Cheerful': 'joyful and playful',
  'Nature-oriented': 'nature-oriented and earthy',
  'Technical': 'technical and modern',
  'Minimalistic': 'minimalistic and clean',
  'Premium': 'premium and luxurious'
};

function generateFontList(preferences: Preferences): string[] {
  console.log("User theme preference:", preferences[4].answer);
  if (preferences[4].answer && fontMapping[preferences[4].answer.toLowerCase()]) {
    return fontMapping[preferences[4].answer.toLowerCase()];
  }
  console.log("Theme not found, defaulting to Roboto.");
  return ['Roboto'];
}

function generateAIPrompt(preferences: Preferences, previousResponse: string | null = null): string {
  const fontList = generateFontList(preferences);
  const themeDescription = themeMapping[preferences[4].answer] || 'default';

  console.log('Available fonts:', fontList);
  console.log('User preferences:\n', preferences);

  return JSON.stringify({
    messages: [
      { role: 'system', content: 'You are an AI designed to generate MUI theme configurations based on a given template. Change the given template and generate a new MUI theme configuration.' },
      { role: 'user', content: `Interpret the user preferences into UI/UX guidelines and generate a MUI theme configuration based on those guidelines. User preferences: ${JSON.stringify(preferences, null, 2)}` },
      { role: 'user', content: `The "Farbgewichtung" parameter means: a higher number means to use only the selected color and maybe a second color.  A lower number means to use as many colors as you wish to combine. For a high color weight, use primarily the primary color and at most one other color. For a low color weight, use a wider range of colors and combine them as you wish) that fit into the color scheme for the background, primary, and secondary colors.` },
      { role: 'user', content: `Also, consider light and dark mode changes. The default is light mode, but the theme configuration JSON colors should reflect the change when switching to dark mode.` },
      { role: 'user', content: `Template for the MUI Theme Configuration JSON (Be sure to use this only as a reference, dont keep the default options given here): ${jsonCode}` },
      { role: 'user', content: `The current theme chosen is "${preferences[4].answer}", which should be interpreted as "${themeDescription}". The chosen theme in the user preferences should be interpreted and UI/UX guidelines should be generated. Ensure distinct and visible changes between themes.` },
      { role: 'user', content: `The font theme means not a specific theme but rather a vibe which the theme should have. Choose a specific theme you see fit. But don't use a standard font, choose something that fits the chosen vibe and also is very distinct and not default. The available fonts for this theme are: ${fontList.join(', ')}` },
      { role: 'user', content: `Everything should be filled out in a way that makes sense and with good UI/UX.` },
      { role: 'user', content: `Pay special attention to color contrast: ensure that if there is a light background, the text is dark, and if there is a dark background, the text is light.` },
      { role: 'user', content: `Be sure to *always* change the layout of the website (Through Flexdirection, display and all the other options given in the template JSON) as well to your liking. So that it drastically improves the UX.` },
      { role: 'user', content: `Never leave the default options or empty strings or null and never leave any placeholders.` }
    ]       
  });  
}

export { generateAIPrompt };