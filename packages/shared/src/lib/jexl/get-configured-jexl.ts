import * as jexl from "jexl";
import {v4} from "uuid";
import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {extendJexlConfiguration} from "@app/shared/extensions/get-configured-jexl";
import {User} from "@app/shared/types/core/user/user";
import {UserRole} from "@app/shared/types/core/user/user-role";
import {registerArrayExtensions} from "@app/shared/jexl/array-extension/register";
import {registerDateTimeExtensions} from "@app/shared/jexl/datetime-extension/register";

let configuredJexl: Jexl;

const getConfiguredJexl = (): Jexl => {
  if(!configuredJexl) {
    configuredJexl = new jexl.Jexl() as Jexl;
    configuredJexl.addFunction('count', count);
    configuredJexl.addFunction('uuid', generateUuuid);
    configuredJexl.addFunction('isRole', isRole);
    configuredJexl.addFunction('userAttr', getAttribute);

    registerArrayExtensions(configuredJexl);
    registerDateTimeExtensions(configuredJexl);

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

const isRole = (user: User, role: UserRole): boolean => {
  return user.roles.includes(role);
}

const getAttribute = (user: User, attrName: string, notSetValue: any = null): any => {
  if(!user.attributes) {
    return notSetValue;
  }

  if(typeof user.attributes[attrName] === "undefined") {
    return notSetValue;
  }

  return user.attributes[attrName];
}

export default getConfiguredJexl();
