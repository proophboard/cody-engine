import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {merge as deepMerge} from "lodash";

export const registerMixedExtensions = (jexl: Jexl): void => {
  jexl.addFunction('count', count);
  jexl.addFunction('merge', merge);
  jexl.addFunction('deepMerge', deepMerge);

  jexl.addTransform('count', count);
  jexl.addTransform('merge', merge);
  jexl.addTransform('deepMerge', deepMerge);
  jexl.addTransform('typeof', isTypeof);
  jexl.addTransform('default', getValOrDefault);
  jexl.addTransform('slice', slice);
}

const count = (val: any): number => {
  if(Array.isArray(val)) {
    return val.length;
  }

  if(typeof val === "string") {
    return val.length;
  }

  if(typeof val === "object") {
    return Object.keys(val).length;
  }

  if(typeof val === "number") {
    return count(''+val);
  }

  return val ? 1 : 0;
}

const merge = (val1: any, val2: any) => {
  if(Array.isArray(val1)) {
    if(!Array.isArray(val2)) {
      val2 = [val2];
    }
    return [...val1, ...val2];
  }

  if(typeof val1 === "object") {
    if(typeof val2 !== "object") {
      val2 = {merged: val2};
    }
    return {...val1, ...val2};
  }

  return val1.toString() + val2.toString();
}

const getValOrDefault = (val: any, notSetVal: any, strict?: boolean) => {
  if(strict) {
    return typeof val === "undefined" ? notSetVal : val;
  } else {
    switch (typeof val) {
      case "object":
        if(Array.isArray(val)) {
          return val.length ? val : notSetVal;
        } else {
          return JSON.stringify(val) === "{}" ? notSetVal : val;
        }
      case "boolean":
        return val;
      default:
        return val ? val : notSetVal;
    }
  }
};

const isTypeof = (val: any, type: string): boolean => {
  return typeof val === type;
}

const slice = (val: any, start: number, end?: number): any => {
  if(typeof val === "string") {
    return val.slice(start, end);
  }

  if(typeof val === "object" && Array.isArray(val)) {
    return val.slice(start, end);
  }

  return val;
}
