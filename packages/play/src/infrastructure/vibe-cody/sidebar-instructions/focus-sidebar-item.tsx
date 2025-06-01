import {FocusedSidebarItem} from "@cody-play/state/focused-element";
import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {Target} from "mdi-material-ui";
import {names} from "@event-engine/messaging/helpers";
import {isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {PlayTopLevelPage} from "@cody-play/state/types";
import {getGroup} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item";

const makeFocusSidebarItem = (label: string, route: string, pageName: string): Instruction => {
  const TEXT = `Focus on sidebar item ${label}`;

  return {
    text: TEXT,
    icon: <Target />,
    noInputNeeded: true,
    isActive: context => !context.focusedElement,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx) => {
      ctx.setFocusedElement({
        id: route,
        name: label,
        type: 'sidebarItem',
        pageName,
      } as FocusedSidebarItem);

      return {
        cody: `Alright, what do you want to change?`
      }
    }
  }
}

const makeFocusSidebarGroupItem = (label: string): Instruction => {
  const TEXT = `Focus on sidebar group ${label}`;

  return {
    text: TEXT,
    icon: <Target />,
    noInputNeeded: true,
    isActive: context => !context.focusedElement,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx) => {
      ctx.setFocusedElement({
        id: `group-${names(label).fileName}`,
        name: label,
        type: 'sidebarItemGroup',
      });

      return {
        cody: `Alright, what do you want to change?`
      }
    }
  }
}

export const FocusOnSidebarItemProvider: InstructionProvider = {
  isActive: context => !context.focusedElement,
  provide: (context, config) => {

    const knownGroups: string[] = [];
    const instructions: Instruction[] = [];

    for (const pageName in config.pages) {
      if(!isTopLevelPage(config.pages[pageName] as PageDefinition)) {
        continue;
      }

      const itemPage = config.pages[pageName] as PlayTopLevelPage;

      if(itemPage.name === "App.Welcome" || itemPage.name === "CodyPlay.VibeCodyProcessing") {
        continue;
      }

      const group = getGroup(itemPage);

      if(group) {
        if(knownGroups.includes(group.label)) {
          continue;
        } else {
          knownGroups.push(group.label)
          instructions.push(makeFocusSidebarGroupItem(group.label));
        }
      }

      instructions.push(makeFocusSidebarItem(
        itemPage.sidebar.label,
        itemPage.route,
        itemPage.name
      ))
    }

    return instructions;
  }
}
