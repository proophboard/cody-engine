import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {cloneDeep, get, set, unset, pick, omit} from "lodash";

export const registerObjectExtension = (jexl: Jexl) => {
  jexl.addTransform('get', getValueFromPath);
  jexl.addTransform('set', setValueToPath);
  jexl.addTransform('unset', unsetPath);
  jexl.addTransform('keys', keys);
  jexl.addTransform('values', values);
  jexl.addTransform('pick', pickJSONSupport);
  jexl.addTransform('omit', omitJSONSupport);
}

const keys = (obj: object | string): string[] => {
  if(typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return [];
    }
  }

  return Object.keys(obj);
}

const values = (obj: object | string): any[] => {
  if(typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return [];
    }
  }

  return Object.values(obj);
}

const pickJSONSupport = <T extends object>(obj: T | string, props: string[]) => {
  if(typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return {};
    }
  }

  return pick(obj as T, props);
}

const omitJSONSupport = <T extends object>(obj: T | string, props: string[]) => {
  if(typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return {};
    }
  }

  return omit(obj as T, props);
}

export const getValueFromPath = (obj: object | Array<unknown> | string, path: string, notSetValue?: any) => {
  if(Array.isArray(obj)) {
    if(obj.length === 0) {
      return notSetValue;
    }

    obj = obj[0];
  }

  if(typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch (e) {
      return notSetValue;
    }
  }

  obj = cloneDeep(obj);

  return get(obj, path, notSetValue);
}

export const setValueToPath = <T extends object>(obj: T | string, path: string, value: any): T | string => {

  const isString = typeof obj === "string";

  if(isString) {
    try {
      obj = JSON.parse(obj as string);
    } catch (e) {
      return obj;
    }
  }

  obj = cloneDeep(obj);

  const modified = set(obj as object, path, value);

  return isString ? JSON.stringify(modified) : modified as T;
}

const unsetPath = <T extends object>(obj: T | string, path: string | string[]): T | string => {

  const isString = typeof obj === "string";

  if(isString) {
    try {
      obj = JSON.parse(obj as string);
    } catch (e) {
      return obj;
    }
  }

  obj = cloneDeep(obj);

  if(!Array.isArray(path)) {
    path = [path];
  }

  path.forEach(p => {
    unset(obj, p);
  })

  return isString ? JSON.stringify(obj) : obj as T;
}


