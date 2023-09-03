import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

export const registerArrayExtensions = (jexl: Jexl): void => {
  jexl.addFunction('push', arrayPush);
  jexl.addFunction('filter', (arr: Array<unknown>, expr: string, ctx: object) => filter(arr, expr, ctx, jexl));
}

const arrayPush = (arr: Array<unknown>, val: unknown): Array<unknown> => {
  if(!Array.isArray(arr)) {
    return [arr, val];
  }
  const copy = [...arr];
  copy.push(val);
  return copy;
}

const filter = (arr: Array<unknown>, expr: string, ctx: object, jexl: Jexl): Array<unknown> => {
  if(!Array.isArray(arr)) {
    return arr;
  }

  const filtered: Array<unknown> = [];

  arr.forEach(item => {
    const itemCtx = {...ctx, item};

    if(jexl.evalSync(expr, itemCtx)) {
      filtered.push(item);
    }
  })

  return filtered;
}



