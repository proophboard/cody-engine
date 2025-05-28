import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {orderBy, reduce, reverse} from "lodash";

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
  jexl.addTransform('orderBy', (arr: Array<unknown>, iteratees: string|string[], orders: Array<"asc"|"desc">) => orderBy(arr, iteratees, orders));
  jexl.addTransform('list', (v: unknown): unknown[] => typeof v === "undefined" ? [] :Array.isArray(v) ? v : [v]);
  jexl.addTransform('reduce', (arr: Array<unknown>, iterateeExpr: string, accumulator: any, ctx?: object): any => reduce(arr, (sum, item) => reduceWithExpr(sum, item, iterateeExpr, ctx || {}, jexl), accumulator));
  jexl.addTransform('reverse', (arr: Array<unknown>) => reverse(arr));
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

  arr.forEach((item, index) => {
    const itemCtx = {...ctx, item, _: item, index};

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

  return arr.map((item, index) => {
    return jexl.evalSync(expr, {...ctx, item, _: item, index});
  })
}

const reduceWithExpr = (sum: any, item: any, expr: string, ctx: object, jexl: Jexl): any => {
  return jexl.evalSync(expr, {...ctx, sum, item});
}



