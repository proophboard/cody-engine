import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import { Group } from "mdi-material-ui";
import {isFocusedSidebarItem} from "@cody-play/state/focused-element";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {getGroup} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item";

const makeMoveSidebarItemIntoExistingGroup = (groupName: string): Instruction => {
  const TEXT = `Move item into group ${groupName}`

  return {
    text: TEXT,
    icon: <Group />,
    noInputNeeded: true,
    isActive: context => context.focusedElement?.type === "sidebarItem",
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const existingPagesInGroup = Object.values(config.pages).filter(p => isTopLevelPage(p as PageDefinition) && getGroup(p as PlayTopLevelPage)?.label === groupName);

      if(existingPagesInGroup.length === 0) {
        return {
          cody: `Oh, something went wrong. I'm looking for existing pages in the sidebar group "${groupName}", but I can't find any in the Cody Play configuration.`,
          details: `This looks like a software bug. Please contact the prooph board team!`,
          type: CodyResponseType.Error,
        }
      }

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

      const firstExistingPage = existingPagesInGroup[0];

      pageCopy.sidebar.group = (firstExistingPage as PlayTopLevelPage).sidebar.group;

      dispatch({
        ctx: getEditedContextFromConfig(config),
        type: "ADD_PAGE",
        page: pageCopy,
        name: focusedElement.pageName,
      });

      return {
        cody: `Moved the item into the group "${groupName}"`
      }
    }
  }
}

const getExistingGroups = (config: CodyPlayConfig): string[] => {
  const groups: string[] = [];

  Object.values(config.pages).forEach(p => {
    if(isTopLevelPage(p as PageDefinition)) {
      const group = getGroup(p as PlayTopLevelPage);

      if(group && !groups.includes(group.label)) {
        groups.push(group.label);
      }
    }
  })

  return groups;
}

export const MoveSidebarItemIntoExistingGroupProvider: InstructionProvider = {
  isActive: (context, config) => context.focusedElement?.type === "sidebarItem" && getExistingGroups(config).length > 0,
  provide: (context, config) => {
    return getExistingGroups(config).map(g => makeMoveSidebarItemIntoExistingGroup(g));
  }
}
