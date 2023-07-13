import * as jexl from "jexl";
import {v4} from "uuid";
import {extendJexlConfiguration} from "@app/extensions/shared/jexl/get-configured-jexl";
import {Jexl} from "@event-engine/infrastructure/jexl/jexl";

let configuredJexl: Jexl;

const getConfiguredJexl = (): Jexl => {
  // @TODO: Jexl is loaded by Cody, too (f.e. in VO list hook)
  // but somehow the jexl context is different in that scenario (different module loading behavior)
  // we need to find out why that happens, but for now we just check if jexl.addFunction is available
  // it works in fe and be and is ignored in the Cody server (jexl is not really used there anyway)
  if(!configuredJexl) {
    configuredJexl = new jexl.Jexl() as Jexl;
    console.log("jexl add function is called");
    configuredJexl.addFunction('count', count);
    configuredJexl.addFunction('uuid', generateUuuid);
    configuredJexl = extendJexlConfiguration(configuredJexl);
  }

  return configuredJexl;
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

const generateUuuid = () => {
  return v4();
}

export default getConfiguredJexl();
