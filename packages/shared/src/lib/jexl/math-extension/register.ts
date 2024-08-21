import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {ceil, floor, round} from "lodash";

export const registerMathExtension = (jexl: Jexl): void => {
  jexl.addTransform('round', (val: number, precision?: number) => round(val, precision));
  jexl.addTransform('ceil', (val: number, precision?: number) => ceil(val, precision));
  jexl.addTransform('floor', (val: number, precision?: number) => floor(val, precision));
}
