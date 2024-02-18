import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

export const registerStringExtensions = (jexl: Jexl): void => {
  jexl.addFunction('upperCase', (str: string) => str.toUpperCase());
  jexl.addFunction('lowerCase', (str: string) => str.toLowerCase());
  jexl.addFunction('split', (str: string, separator: string) => str.split(separator));
}
