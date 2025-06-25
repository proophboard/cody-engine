import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {isFocusedSidebarItem} from "@cody-play/state/focused-element";
import {HeartOutline} from "mdi-material-ui";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {getIconNameFromSearchStr, matchIcons} from "@cody-play/infrastructure/vibe-cody/utils/icons/mdi-icons";

const makeChangeSidebarIconInstruction = (icon: string): Instruction => {
  const TEXT = `Use icon ${icon}`;

  return {
    text: TEXT,
    noInputNeeded: true,
    icon: <MdiIcon icon={icon} />,
    isActive: context => context.focusedElement?.type === "sidebarItem",
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const {focusedElement} = ctx;

      if(!focusedElement || !isFocusedSidebarItem(focusedElement)) {
        return {
          cody: `Oh, something went wrong. I can't change the icon, because focused element is not a sidebar item`,
          details: `This looks like a software bug. Please contact the prooph board team.`,
          type: CodyResponseType.Error
        }
      }

      const page = config.pages[focusedElement.pageName];

      if(!page) {
        return {
          cody: `Oh, something went wrong. The focused sidebar item should be configured for page ${focusedElement.pageName}, but I can't find the page in teh cody play config`,
          details: `This looks like a bug in the software. Please contact the prooph board team.`,
          type: CodyResponseType.Error
        }
      }

      const pageCopy = cloneDeepJSON(page) as PlayTopLevelPage;

      pageCopy.sidebar.icon = icon;

      dispatch({
        ctx: getEditedContextFromConfig(config),
        type: "ADD_PAGE",
        page: pageCopy,
        name: focusedElement.pageName,
      });

      return {
        cody: `Changed the icon.`
      }
    }
  }
}

export const ChangeSidebarItemIconProvider: InstructionProvider = {
  isActive: context => {
    if(context.focusedElement?.type !== "sidebarItem") {
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
                  return await makeChangeSidebarIconInstruction(firstMatchedIcon).execute(input, ctx, dispatch, config, navigateTo);
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

    return matchIcons(iconName).map(makeChangeSidebarIconInstruction);
  }
}
