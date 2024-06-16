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
  verspielt: ['Pacifico', 'Baloo 2', 'Caveat'],
  schlicht: ['Open Sans', 'Lato', 'Montserrat'],
  maschinell: ['Roboto Mono', 'Source Code Pro', 'Fira Code'],
  gerundet: ['Nunito', 'Quicksand', 'Comic Neue'],
  elegant: ['Playfair Display', 'Merriweather', 'Abril Fatface'],
  dramatisch: ['Bebas Neue', 'Righteous', 'Bungee'],
  sachlich: ['Roboto', 'Inter', 'Ubuntu']
};

const themeMapping: { [key: string]: string } = {
  'Seriös': 'serious and professional',
  'Energiegeladen': 'energetic and vibrant',
  'Fröhlich': 'joyful and playful',
  'Naturverbunden': 'nature-oriented and earthy',
  'Technisch': 'technical and modern',
  'Minimalistisch': 'minimalistic and clean',
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
      { role: 'system', content: 'You are an AI designed to generate MUI theme configurations based on a given template. Change the given template and generate a new MUI theme configuration. Never leave the default options or empty strings or null and never leave any placeholders. Everything should be filled out in a way that makes sense and with good UI/UX. Pay special attention to color contrast: ensure that if there is a light background, the text is dark, and if there is a dark background, the text is light. The "Farbgewichtung" parameter means: a higher number means to use only the selected color and maybe a second color. A lower number means to use as many colors as you wish to combine. For a high color weight, use primarily the primary color and at most one other color. For a low color weight, use a wider range of colors and combine them as you wish) that fit into the color scheme for the background, primary, and secondary colors. The chosen theme in the user preferences should be interpreted and UI/UX guidelines should be generated. Ensure distinct and visible changes between themes. Also, consider light and dark mode changes. The default is light mode, but the theme configuration JSON colors should reflect the change when switching to dark mode.' },
      { role: 'user', content: `User preferences: ${JSON.stringify(preferences, null, 2)}` },
      { role: 'user', content: `${jsonCode}` },
      { role: 'user', content: `Interpret the user preferences into UI/UX guidelines and generate a MUI theme configuration based on those guidelines. Change the layout of the website as well to your liking. Ensure all fields are filled in and more importantly: changed according to the user preferences. The font theme means not a specific theme but rather a vibe which the theme should have. Choose a specific theme you see fit. But don't use a standard font, choose something that fits the chosen vibe and also is very distinct and not default. The available fonts for this theme are: ${fontList.join(', ')}` },
      { role: 'user', content: `The current theme chosen is "${preferences[4].answer}", which should be interpreted as "${themeDescription}". Ensure that the generated UI/UX guidelines are distinct and visibly different from other possible themes. Ensure that the theme can switch between light and dark modes, and the colors in the theme configuration JSON should reflect that change.` }
    ]
  });
}

export { generateAIPrompt };