import {
  CodyInstructionResponse,
  Instruction,
  InstructionExecutionCallback, InstructionProvider
} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {PaletteOutline} from "mdi-material-ui";
import {jsonrepair} from "jsonrepair";
import {merge} from "lodash/fp";
import {createTheme} from "@frontend/app/layout/theme";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {CodyResponseType} from "@proophboard/cody-types";
import {hexToRGBA} from "@cody-play/infrastructure/vibe-cody/utils/hex-to-rgba";

const textVariants = [
  `I'd like to change the color theme`,
  `How can I change the theme?`,
  `Change the layout`
]

const makeChangeTheme = (text: string): Instruction => {
  return {
    text,
    icon: <PaletteOutline />,
    noInputNeeded: true,
    match: input => input === text,
    isActive: context => !context.focusedElement,
    execute: async (input, ctx, dispatch, config) => {
      return {
        cody: `If you're familiar with Matrial UI, you can change the theme in the AppSettings (gears icon in the top menu).`,
        details: `Alternatively, and that's the easier option, you can use the "MUI theme creator" tool linked below. It's a free tool and has a built-in AI theme creator. When you're happy with the theme, just copy the configuration from the right sidebar of the tool into the instruction input here. I'll appy the theme to the app!`,
        helpLink: {
          text: 'MUI Theme Creator',
          href: 'https://muiv6-theme-creator.web.app/?tab=preview'
        },
        type: CodyResponseType.Question,
        instructionReply: makeInstructionReplyCallback(true)
      }
    }
  }
}

const makeInstructionReplyCallback = (withHint: boolean): InstructionExecutionCallback => {
  return async (input: string, ctx, dispatch, config, navigateTo) => {
    input = jsonrepair(input.replace('const themeOptions = ', '').replace('};', '}'));

    try {
      let theme = config.theme;
      let toggleMode = false;

      const themeOptions = JSON.parse(input);

      if(themeOptions.palette && themeOptions.palette.mode) {
        const {palette} = themeOptions;

        delete themeOptions.palette;

        // workaround for MuiDataGrid, if divider color is too light, borders are not really visible
        // We need to upgrade MUI to get around the issue
        if(palette.divider && palette.divider.startsWith('#')) {
          delete palette.divider;
        }

        // Hover is too dark without opacity
        if(palette.action && palette.action.hover && palette.action.hover.startsWith('#')) {
          palette.action.hover = hexToRGBA(palette.action.hover, '0.04');
        }

        if(palette.mode === "dark") {
          theme = merge(theme, {darkPalette: palette})
          toggleMode = ctx.colorMode !== "dark";
        } else {
          theme = merge(theme, {lightPalette: palette})
          toggleMode = ctx.colorMode !== "light";
        }
      }

      theme = merge(theme, themeOptions);

      // Test both color modes
      const lightOptions = merge(theme, {palette: {mode: 'light'}});
      const darkOptions = merge(theme, {palette: {mode: 'dark'}});

      createTheme(lightOptions);
      createTheme(darkOptions);

      dispatch({
        type: "CHANGE_THEME",
        theme,
        ctx: getEditedContextFromConfig(config)
      })

      if(toggleMode) {
        ctx.toggleColorMode();
      }

      return {
        cody: `Nice theme, enjoy the new look & feel of your app!`,
        details: withHint
          ? `Hint: You can switch between light and dark theme in the MUI theme creator tool, and you can also switch the theme here (sun icon in the top menu).\n\nCopy both configurations from the theme creator, so that your new theme works in light and dark mode.`
          : undefined,
        type: withHint ? CodyResponseType.Question : CodyResponseType.Info,
        instructionReply: withHint ? makeInstructionReplyCallback(false) : undefined,
      }
    } catch (e) {
      return {
        'cody': `Oh, that did not work. I failed to parse the theme configuration. Maybe try to export the theme configuration as "JSON" from the MUI theme creator. You can find the export function at the bottom of the left sidebar in the linked tool.`,
        'details': `Parsing error was: ${(e as any).toString()}`,
        helpLink: {
          text: 'MUI Theme Creator',
          href: 'https://muiv6-theme-creator.web.app/?tab=preview'
        },
        type: CodyResponseType.Question,
        instructionReply: makeInstructionReplyCallback(true),
      }
    }
  }
}

export const ChangeThemeProvider: InstructionProvider = {
  isActive: context => !context.focusedElement,
  provide: () => textVariants.map(text => makeChangeTheme(text))
}
