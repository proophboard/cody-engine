import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

export const registerTypeCastExtensions = (jexl: Jexl): void => {
  jexl.addTransform('toInt', (val: string) => parseInt(val));
  jexl.addTransform('toFloat', (val: string) => parseFloat(val));
  jexl.addTransform('toString', (val: any) => '' + val);
  jexl.addTransform('toJSON', (val: any, space?: number) => JSON.stringify(val, null, space));
  jexl.addTransform('fromJSON', (val: string): any => JSON.parse(val));
}
