import {PlayPageDefinition, PlayPageRegistry} from "@cody-play/state/types";

export const findTabsOfGroup = (page: PlayPageDefinition, pages: PlayPageRegistry): PlayPageDefinition[] => {
  if(!page.tab) {
    return [];
  }

  return Object.values(pages).filter(p => p.tab && p.tab.group === page.tab!.group && p.name !== page.name);
}
