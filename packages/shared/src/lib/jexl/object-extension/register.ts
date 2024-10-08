import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {cloneDeep, get, set, unset} from "lodash";

export const registerObjectExtension = (jexl: Jexl) => {
  jexl.addTransform('get', getValueFromPath);
  jexl.addTransform('set', setValueToPath);
  jexl.addTransform('unset', unsetPath);
  jexl.addTransform('keys', (obj: object) => Object.keys(obj));
  jexl.addTransform('values', (obj: object) => Object.values(obj));
}

const getValueFromPath = (obj: object | Array<unknown>, path: string, notSetValue?: any) => {
  if(Array.isArray(obj)) {
    if(obj.length === 0) {
      return notSetValue;
    }

    obj = obj[0];
  }

  obj = cloneDeep(obj);

  return get(obj, path, notSetValue);
}

const setValueToPath = <T extends object>(obj: T, path: string, value: any): T => {
  obj = cloneDeep(obj);
  return set(obj, path, value);
}

const unsetPath = <T extends object>(obj: T, path: string): T => {
  obj = cloneDeep(obj);
  unset(obj, path);
  return obj;
}


