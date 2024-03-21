import * as jexl from "jexl";
import {v4} from "uuid";
import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {extendJexlConfiguration} from "@app/shared/extensions/get-configured-jexl";
import {User} from "@app/shared/types/core/user/user";
import {UserRole} from "@app/shared/types/core/user/user-role";
import {registerArrayExtensions} from "@app/shared/jexl/array-extension/register";
import {registerDateTimeExtensions} from "@app/shared/jexl/datetime-extension/register";
import {PageData} from "@app/shared/types/core/page-data/page-data";
import {registerStringExtensions} from "@app/shared/jexl/string-extension/register";
import {registerObjectExtension} from "@app/shared/jexl/object-extension/register";

let configuredJexl: Jexl;

const getConfiguredJexl = (): Jexl => {
  if(!configuredJexl) {
    configuredJexl = new jexl.Jexl() as Jexl;
    configuredJexl.addFunction('count', count);
    configuredJexl.addFunction('merge', merge);
    configuredJexl.addFunction('uuid', generateUuuid);
    configuredJexl.addFunction('isRole', isRole);
    configuredJexl.addFunction('userAttr', getAttribute);
    configuredJexl.addFunction('pageData', getPageData);
    configuredJexl.addTransform('data', getPageData);

    configuredJexl.addTransform('default', getValOrDefault)

    registerStringExtensions(configuredJexl);
    registerArrayExtensions(configuredJexl);
    registerObjectExtension(configuredJexl);
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

const getPageData = (pageData: PageData | undefined, name: string, defaultValue: any): any => {
  if(!pageData) {
    return defaultValue;
  }

  if(!pageData[name]) {
    return defaultValue;
  }

  if(!pageData[name].isSuccess) {
    return defaultValue;
  }

  return pageData[name].data;
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

export default getConfiguredJexl();
