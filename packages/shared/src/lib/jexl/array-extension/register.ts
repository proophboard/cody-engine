import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

export const registerArrayExtensions = (jexl: Jexl): void => {
  jexl.addFunction('push', arrayPush);
  jexl.addTransform('push', arrayPush);
  jexl.addFunction('contains', arrayContains);
  jexl.addTransform('contains', arrayContains);
  jexl.addFunction('filter', (arr: Array<unknown>, expr: string, ctx: object) => filter(arr, expr, ctx, jexl));
  jexl.addTransform('filter', (arr: Array<unknown>, expr: string, ctx?: object) => filter(arr, expr, ctx || {}, jexl))
  jexl.addFunction('map', (arr: Array<unknown>, expr: string, ctx: object) => map(arr, expr, ctx, jexl));
  jexl.addTransform('map', (arr: Array<unknown>, expr: string, ctx?: object) => map(arr, expr, ctx || {}, jexl));
  jexl.addFunction('join', (arr: Array<unknown>, separator?: string) => arr.join(separator));
  jexl.addTransform('join', (arr: Array<unknown>, separator?: string) => arr.join(separator));
  jexl.addTransform('first', (arr: Array<unknown>, notSetValue?: any) => arr.length? arr[0] : notSetValue);
  jexl.addTransform('last', (arr: Array<unknown>, notSetValue?: any) => arr.length? arr[arr.length-1] : notSetValue);
}

const arrayPush = (arr: Array<unknown>, val: unknown): Array<unknown> => {
  if(!arr) {
    arr = [];
  }

  if(!Array.isArray(arr)) {
    return [arr, val];
  }
  const copy = [...arr];
  copy.push(val);
  return copy;
}

const arrayContains = (arr: Array<unknown>, val: unknown): boolean => {
  if(!Array.isArray(arr)) {
    return false;
  }

  return arr.includes(val);
}

const filter = (arr: Array<unknown>, expr: string, ctx: object, jexl: Jexl): Array<unknown> => {
  if(!arr) {
    arr = [];
  }

  if(!Array.isArray(arr)) {
    throw new Error(`First argument of jexl filter() needs to be an array. ${typeof arr} given.`);
  }

  const filtered: Array<unknown> = [];

  arr.forEach(item => {
    const itemCtx = {...ctx, item, _: item};

    if(jexl.evalSync(expr, itemCtx)) {
      filtered.push(item);
    }
  })

  return filtered;
}

const map = (arr: Array<unknown>, expr: string, ctx: object, jexl: Jexl): Array<unknown> => {
  if(!arr) {
    arr = [];
  }

  if(!Array.isArray(arr)) {
    throw new Error(`First argument of jexl map() needs to be an array. ${typeof arr} given.`);
  }

  return arr.map(item => {
    return jexl.evalSync(expr, {...ctx, item, _: item});
  })
}



