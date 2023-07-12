import * as jexl from "jexl";

export type Jexl = typeof jexl;

const getConfiguredJexl = (): Jexl => {
  jexl.addFunction('count', count);

  return jexl;
}

const count = (val: any) => {
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
    return val;
  }

  return val ? 1 : 0;
}

export default jexl;
