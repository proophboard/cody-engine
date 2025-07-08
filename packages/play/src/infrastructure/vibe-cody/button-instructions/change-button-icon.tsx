import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {setButtonProperty} from "@cody-play/infrastructure/vibe-cody/utils/set-button-property";
import {FocusedButton} from "@cody-play/state/focused-element";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {HeartOutline} from "mdi-material-ui";
import {getIconNameFromSearchStr, matchIcons} from "@cody-play/infrastructure/vibe-cody/utils/icons/mdi-icons";

const makeChangeButtonIconInstruction = (icon: string): Instruction => {
  const TEXT = `Use icon ${icon}`;

  return {
    text: TEXT,
    label: icon,
    noInputNeeded: true,
    icon: <MdiIcon icon={icon} />,
    isActive: context => !!context.focusedElement && context.focusedElement.type === "button",
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const success = await setButtonProperty(
        ctx.focusedElement! as FocusedButton,
        'icon',
        icon,
        config,
        dispatch
      )

      if (playIsCodyError(success)) {
        return success;
      }

      return {
        cody: `Changed the button icon.`
      }
    }
  }
}

export const ChangeButtonIconProvider: InstructionProvider = {
  isActive: context => {
    if(!context.focusedElement || context.focusedElement.type !== "button") {
      return false;
    }

    return true;
  },
  provide: (context) => {
    const iconName = getIconNameFromSearchStr(context.searchStr);

    if(!iconName) {
      return [
        {
          isActive: () => true,
          text: `Use icon `,
          icon: <HeartOutline />,
          allowSubSuggestions: true,
          match: input => input === "Use icon ",
          execute: async (input, ctx, dispatch, config, navigateTo) => {
            const iconNameFromInput = getIconNameFromSearchStr(input);

            if(iconNameFromInput) {
              const matchedIcons = matchIcons(iconNameFromInput);

              if(matchedIcons.length > 0) {
                const firstMatchedIcon = matchedIcons.shift();

                if(firstMatchedIcon) {
                  return await makeChangeButtonIconInstruction(firstMatchedIcon).execute(input, ctx, dispatch, config, navigateTo);
                }
              }
            }

            return {
              cody: `Sorry, can't find a matching icon.`,
              details: `You can lookup an icon name on the page:`,
              helpLink: {
                text: 'pictogrammers.com',
                href: 'https://pictogrammers.com/library/mdi/'
              }
            }
          }
        }
      ];
    }

    return matchIcons(iconName).map(makeChangeButtonIconInstruction);
  }
}
