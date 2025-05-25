import {Instruction, InstructionProvider} from "@cody-play/app/components/core/vibe-cody/VibeCodyDrawer";
import {ArrowCircleDown, ArrowCircleUp} from "@mui/icons-material";
import {isFocusedSidebarItem} from "@cody-play/state/focused-element";
import {CodyResponseType} from "@proophboard/cody-types";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {PlayPageDefinition, PlayTopLevelPage} from "@cody-play/state/types";
import {cloneConfig, CodyPlayConfig, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {isTopLevelPage, PageDefinition, TopLevelGroup} from "@frontend/app/pages/page-definitions";
import {sortTopLevelPages} from "@frontend/app/layout/Sidebar";

type Direction = 'up' | 'down';

export const MoveSidebarItemProvider: InstructionProvider = {
  isActive: context => context.focusedElement?.type === "sidebarItem",
  provide: context => ['up', 'down'].map(direction => makeMoveSidebarItem(direction as Direction))
}

const makeMoveSidebarItem = (direction: Direction): Instruction => {
  const TEXT = `Move one position ${direction}`;

  return {
    text: TEXT,
    icon: direction === "up" ? <ArrowCircleUp /> : <ArrowCircleDown />,
    isActive: context => context.focusedElement?.type === "sidebarItem",
    noInputNeeded: true,
    match: input => input.startsWith(TEXT),
    execute: async (input, ctx, dispatch, config) => {
      const {focusedElement} = ctx;

      if(!focusedElement || !isFocusedSidebarItem(focusedElement)) {
        return {
          cody: `Oh, something went wrong. I can't move the item, because focused element is not a sidebar item`,
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

      const group = getGroup(pageCopy);

      if(group) {
        newConfig = moveWithinGroup(pageCopy, group, direction, newConfig);
      } else {
        newConfig = moveOnTopLevel(pageCopy, direction, newConfig);
      }

      dispatch({
        type: "INIT",
        payload: newConfig,
        ctx: getEditedContextFromConfig(newConfig),
      })

      return {
        cody: `I moved the item`,
      }
    }
  }
}

const getGroup = (page: PlayTopLevelPage): TopLevelGroup | undefined => {
  if(!page.sidebar.group) {
    return;
  }

  return typeof page.sidebar.group === "string"
    ? {label: page.sidebar.group, icon: "square"}
    : page.sidebar.group
}

const move = (page: PlayTopLevelPage, direction: Direction, before: PlayTopLevelPage[], after: PlayTopLevelPage[]): PlayTopLevelPage[] => {
  if(direction === "up") {
    const beforePage = before.pop();

    before.push(page);

    if(beforePage) {
      if((beforePage.sidebar.position || 5) < (page.sidebar.position || 5)) {
        page.sidebar.position = (beforePage.sidebar.position || 5);
      }

      before.push(beforePage);
    }
  } else {
    const afterPage = after.shift();

    after.unshift(page);

    if(afterPage) {
      if((afterPage.sidebar.position || 5) > (page.sidebar.position || 5) ) {
        page.sidebar.position = afterPage.sidebar.position || 5
      }

      after.unshift(afterPage);
    }
  }

  return [...before, ...after];
}

const moveWithinGroup = (page: PlayTopLevelPage, group: TopLevelGroup, direction: Direction, config: CodyPlayConfig): CodyPlayConfig => {
  const pagesBeforeGroup: PlayTopLevelPage[] = [];
  const pagesAfterGroup: PlayTopLevelPage[] = [];
  const pagesBeforeInGroup: PlayTopLevelPage[] = [];
  const pagesAfterInGroup: PlayTopLevelPage[] = [];
  const subLevelPages: PlayPageDefinition[] = [];
  let matchedGroup = false;
  let matchedPage = false;

  for (const pageName in config.pages) {
    if(!isTopLevelPage(config.pages[pageName] as PageDefinition)) {
      subLevelPages.push(config.pages[pageName]);
      continue;
    }

    const itemPage = config.pages[pageName] as PlayTopLevelPage;
    const itemGroup = getGroup(itemPage);

    if(itemGroup && itemGroup.label === group.label) {
      matchedGroup = true;

      if(pageName === page.name) {
        matchedPage = true;
      } else {
        matchedPage ? pagesAfterInGroup.push(itemPage) : pagesBeforeInGroup.push(itemPage);
      }
    } else {
      matchedGroup ? pagesAfterGroup.push(itemPage) : pagesBeforeGroup.push(itemPage);
    }
  }

  config.pages = {};

  pagesBeforeGroup.forEach(p => config.pages[p.name] = p);

  move(page, direction, pagesBeforeInGroup, pagesAfterInGroup).forEach(p => config.pages[p.name] = p);

  pagesAfterGroup.forEach(p => config.pages[p.name] = p);

  subLevelPages.forEach(p => config.pages[p.name] = p);

  return config;
}

const moveOnTopLevel = (page: PlayTopLevelPage, direction: Direction, config: CodyPlayConfig): CodyPlayConfig => {
  const pagesBefore: PlayTopLevelPage[] = [];
  const pagesAfter: PlayTopLevelPage[] = [];
  const groupPages: PlayTopLevelPage[] = [];
  const subLevelPages: PlayPageDefinition[] = [];
  let matchedPage = false;

  const knownGroups: string[] = [];

  for (const pageName in config.pages) {
    if(!isTopLevelPage(config.pages[pageName] as PageDefinition)) {
      subLevelPages.push(config.pages[pageName]);
      continue;
    }
    if(pageName !== page.name) {
      const itemPage = config.pages[pageName] as PlayTopLevelPage;
      const group = getGroup(itemPage);

      if(group) {
        if(knownGroups.includes(group.label)) {
          groupPages.push(itemPage);
          continue;
        } else {
          knownGroups.push(group.label)
          // First itemPage of group is kept on top level, as this page is the anchor for the group
        }
      }

      matchedPage ? pagesAfter.push(config.pages[pageName] as PlayTopLevelPage) : pagesBefore.push(config.pages[pageName] as PlayTopLevelPage)
    } else {
      matchedPage = true;
    }
  }

  config.pages = {};

  move(page, direction, pagesBefore, pagesAfter).forEach(p => config.pages[p.name] = p);

  groupPages.forEach(p => config.pages[p.name] = p);

  subLevelPages.forEach(p => config.pages[p.name] = p);

  return config;
}
