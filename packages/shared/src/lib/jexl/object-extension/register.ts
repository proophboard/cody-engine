import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {get, set} from "lodash";

export const registerObjectExtension = (jexl: Jexl) => {
  jexl.addTransform('get', getValueFromPath);
  jexl.addTransform('set', setValueToPath);
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

  return get(obj, path, notSetValue);
}

const setValueToPath = <T extends object>(obj: T, path: string, value: any): T => {
  return set(obj, path, value);
}
