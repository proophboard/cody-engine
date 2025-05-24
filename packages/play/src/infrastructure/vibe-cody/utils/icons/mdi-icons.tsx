import * as icons from "mdi-material-ui";
import {includesAllWords} from "@cody-play/infrastructure/vibe-cody/utils/includes-all-words";

const iconNames = Object.keys(icons);

export const getIconNameFromSearchStr = (searchStr: string): string | undefined => {
  const iconParts = searchStr.split('icon ');

  if(iconParts.length < 2) {
    return;
  }

  const iconPart = iconParts.pop();

  if(!iconPart) {
    return;
  }

  return iconPart;
}

const matchIconsStartingWith = (iconName: string): string[] => {
  const matches: string[] = [];

  if(iconName.length < 3) {
    return matches;
  }

  for (const name of iconNames) {
    if(name.toLowerCase().startsWith(iconName.toLowerCase())) {
      matches.push(name);

      if(matches.length > 30) {
        return matches;
      }
    }
  }

  return matches;
}

export const matchIcons = (iconName: string): string[] => {
  const matches: string[] = [];

  const words = iconName.toLowerCase().split(" ");

  for (const name of iconNames) {
    if(includesAllWords(name.toLowerCase(), words)) {
      matches.push(name);

      if(matches.length > 30) {
        // Check for perfect matches
        matchIconsStartingWith(iconName).forEach(i => {
          if(!matches.includes(i)) {
            matches.unshift(i);
          }
        })

        return matches;
      }
    }
  }

  return matches;
}
