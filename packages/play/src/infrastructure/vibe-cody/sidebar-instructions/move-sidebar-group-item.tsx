import {Direction, getGroup} from "@cody-play/infrastructure/vibe-cody/sidebar-instructions/move-sidebar-item";
import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {ArrowCircleDown, ArrowCircleUp} from "@mui/icons-material";
import {CodyResponseType} from "@proophboard/cody-types";
import {isTopLevelPage, PageDefinition} from "@frontend/app/pages/page-definitions";
import {PlayPageDefinition, PlayTopLevelPage} from "@cody-play/state/types";
import {cloneConfig, CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {sortTopLevelPages} from "@frontend/app/layout/Sidebar";

const makeMoveSidebarGroupItem = (direction: Direction): Instruction => {
  const TEXT = `Move one position ${direction}`;

  return {
    text: TEXT,
    icon: direction === "up" ? <ArrowCircleUp /> : <ArrowCircleDown />,
    isActive: context => context.focusedElement?.type === "sidebarItemGroup",
    noInputNeeded: true,
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

      let newConfig = cloneConfig(config);

      const topLevelPages: PlayTopLevelPage[] = [];
      const subLevelPages: PlayPageDefinition[] = [];

      Object.values(newConfig.pages).forEach(p => {
        if(isTopLevelPage(p as PageDefinition)) {
          topLevelPages.push(p as PlayTopLevelPage)
        } else {
          subLevelPages.push(p)
        }
      })

      newConfig.pages = {};

      topLevelPages.sort(sortTopLevelPages).forEach(p => newConfig.pages[p.name] = p);
      subLevelPages.forEach(p => newConfig.pages[p.name] = p);

      newConfig = moveOnTopLevel(groupPages, groupName, direction, newConfig);

      dispatch({
        type: "INIT",
        payload: newConfig,
        ctx: getEditedContextFromConfig(newConfig),
      })

      return {
        cody: `I moved the sidebar group`,
      }
    }
  }
}

const moveOnTopLevel = (groupPages: PlayTopLevelPage[], groupLabel: string, direction: Direction, config: CodyPlayConfig): CodyPlayConfig => {
  const pagesBefore: PlayTopLevelPage[] = [];
  const pagesAfter: PlayTopLevelPage[] = [];
  const otherGroupPages: PlayTopLevelPage[] = [];
  const subLevelPages: PlayPageDefinition[] = [];
  let matchedGroup = false;

  const knownGroups: string[] = [];

  for (const pageName in config.pages) {
    if(!isTopLevelPage(config.pages[pageName] as PageDefinition)) {
      subLevelPages.push(config.pages[pageName]);
      continue;
    }

    const itemPage = config.pages[pageName] as PlayTopLevelPage;
    const group = getGroup(itemPage);

    if(group) {
      if(group.label === groupLabel) {
        matchedGroup = true;
        continue;
      }

      if(knownGroups.includes(group.label)) {
        otherGroupPages.push(itemPage);
        continue;
      } else {
        knownGroups.push(group.label)
        // First itemPage of group is kept on top level, as this page is the anchor for the group
      }
    }

    matchedGroup ? pagesAfter.push(config.pages[pageName] as PlayTopLevelPage) : pagesBefore.push(config.pages[pageName] as PlayTopLevelPage)
  }

  config.pages = {};

  move(groupPages, direction, pagesBefore, pagesAfter).forEach(p => config.pages[p.name] = p);

  otherGroupPages.forEach(p => config.pages[p.name] = p);

  subLevelPages.forEach(p => config.pages[p.name] = p);

  return config;
}

const move = (groupPages: PlayTopLevelPage[], direction: Direction, before: PlayTopLevelPage[], after: PlayTopLevelPage[]): PlayTopLevelPage[] => {
  if(direction === "up") {
    const beforePage = before.pop();

    before.push(...groupPages);

    if(beforePage) {
      if((beforePage.sidebar.position || 5) < (groupPages[0].sidebar.position || 5)) {
        groupPages.forEach(p => p.sidebar.position = (beforePage.sidebar.position || 5)) ;
      }

      before.push(beforePage);
    }
  } else {
    const afterPage = after.shift();

    after.unshift(...groupPages);

    if(afterPage) {
      if((afterPage.sidebar.position || 5) > (groupPages[0].sidebar.position || 5) ) {
        groupPages.forEach(p => p.sidebar.position = (afterPage.sidebar.position || 5)) ;
      }

      after.unshift(afterPage);
    }
  }

  return [...before, ...after];
}

export const MoveSidebarGroupItemProvider: InstructionProvider = {
  isActive: context => context.focusedElement?.type === "sidebarItemGroup",
  provide: () => (['up', 'down'] as Direction[]).map(makeMoveSidebarGroupItem)
}
