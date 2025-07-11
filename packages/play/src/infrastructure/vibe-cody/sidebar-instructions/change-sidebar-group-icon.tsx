import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import MdiIcon from "@cody-play/app/components/core/MdiIcon";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {getEditedContextFromConfig} from "@cody-play/state/config-store";
import {isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {getGroup} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item";
import {getIconNameFromSearchStr, matchIcons} from "@cody-play/infrastructure/vibe-cody/utils/icons/mdi-icons";
import {HeartOutline} from "mdi-material-ui";

const makeChangeSidebarGroupIconInstruction = (icon: string): Instruction => {
  const TEXT = `Use icon ${icon}`;

  return {
    text: TEXT,
    label: icon,
    noInputNeeded: true,
    icon: <MdiIcon icon={icon}/>,
    isActive: context => context.focusedElement?.type === "sidebarItemGroup",
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const {focusedElement} = ctx;

      if (!focusedElement) {
        return {
          cody: `Oh, something went wrong. I can't change the icon, because focused element is not a sidebar item group.`,
          details: `This looks like a software bug. Please contact the prooph board team.`,
          type: CodyResponseType.Error
        }
      }

      const groupName = focusedElement.name;

      const groupPages = Object.values(config.pages).filter(p  => isTopLevelPage(p as PageDefinition) && getGroup(p as PlayTopLevelPage)?.label === groupName) as PlayTopLevelPage[];

      groupPages.forEach(p => {
        const copy = cloneDeepJSON(p) as PlayTopLevelPage;
        const group = getGroup(copy);
        if (group) {
          group.icon = icon;
        }

        copy.sidebar.group = group;

        dispatch({
          ctx: getEditedContextFromConfig(config),
          type: "ADD_PAGE",
          page: copy,
          name: copy.name,
        });
      })

      return {
        cody: `Changed the icon.`
      }
    }
  }
}

export const ChangeSidebarGroupIconProvider: InstructionProvider = {
  isActive: context => {
    if(context.focusedElement?.type !== "sidebarItemGroup") {
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
                  return await makeChangeSidebarGroupIconInstruction(firstMatchedIcon).execute(input, ctx, dispatch, config, navigateTo);
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

    return matchIcons(iconName).map(makeChangeSidebarGroupIconInstruction);
  }
}
