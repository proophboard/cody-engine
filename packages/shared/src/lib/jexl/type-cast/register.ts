import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

export const registerTypeCastExtensions = (jexl: Jexl): void => {
  jexl.addTransform('toInt', (val: string) => parseInt(val));
  jexl.addTransform('toFloat', (val: string) => parseFloat(val));
  // toString() seems to be reserved in Jexl, so we have to use toStr
  jexl.addTransform('toStr', toStr);
  jexl.addTransform('toJSON', (val: any, space?: number) => JSON.stringify(val, null, space));
  jexl.addTransform('fromJSON', (val: string): any => JSON.parse(val));
  jexl.addTransform('toArray', (val: any) => Array.isArray(val) ? val : [val]);
  jexl.addTransform('toLocal', toLocaleString);
}

const toStr = (val: any) => val instanceof Error ? val.message : typeof val === "object" ? JSON.stringify(val) : '' + val;
const toLocaleString = (val: any) => {
  if(typeof val === "undefined") {
    return '';
  }

  if(typeof val.toLocaleString === "function") {
    return val.toLocaleString();
  }

  return toStr(val);
}
