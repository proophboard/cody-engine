import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {pad, padStart, padEnd} from "lodash";

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
  jexl.addTransform('pad', (str: string, length: number, chars: string) => pad(str, length, chars));
  jexl.addTransform('padStart', (str: string, length: number, chars: string) => padStart(str, length, chars));
  jexl.addTransform('padEnd', (str: string, length: number, chars: string) => padEnd(str, length, chars));
  jexl.addTransform('replace', (str: string, search: string, replace: string) => str.split(search).join(replace));
}
