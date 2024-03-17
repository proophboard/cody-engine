import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

export const registerStringExtensions = (jexl: Jexl): void => {
  jexl.addFunction('upperCase', (str: string) => str.toUpperCase());
  jexl.addTransform('upper', (str: string) => str.toUpperCase());
  jexl.addFunction('lowerCase', (str: string) => str.toLowerCase());
  jexl.addTransform('lower', (str: string) => str.toLowerCase());
  jexl.addFunction('split', (str: string, separator: string) => str.split(separator));
  jexl.addTransform('split', (str: string, separator?: string) => str.split(separator || " "));
  jexl.addTransform('trim', (str: string) => str.trim());
  jexl.addTransform('trimEnd', (str: string) => str.trimEnd());
  jexl.addTransform('trimStart', (str: string) => str.trimStart());
}
