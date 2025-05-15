import * as jexl from "jexl";
import {v4} from "uuid";
import {Jexl} from "@event-engine/infrastructure/jexl/jexl";
import {extendJexlConfiguration} from "@app/shared/extensions/get-configured-jexl";
import {User} from "@app/shared/types/core/user/user";
import {UserRole} from "@app/shared/types/core/user/user-role";
import {registerArrayExtensions} from "@app/shared/jexl/array-extension/register";
import {registerDateTimeExtensions} from "@app/shared/jexl/datetime-extension/register";
import {isPageFormReference, isQueryResult, PageData} from "@app/shared/types/core/page-data/page-data";
import {registerStringExtensions} from "@app/shared/jexl/string-extension/register";
import {getValueFromPath, registerObjectExtension, setValueToPath} from "@app/shared/jexl/object-extension/register";
import {registerTypeCastExtensions} from "@app/shared/jexl/type-cast/register";
import {registerMathExtension} from "@app/shared/jexl/math-extension/register";
import {cloneDeep, merge as deepMerge} from "lodash";
import {registerSequenceExtension} from "@app/shared/jexl/sequence-extension/register";


let configuredJexl: Jexl;

const getConfiguredJexl = (): Jexl => {
  if(!configuredJexl) {
    configuredJexl = new jexl.Jexl() as Jexl;

    const evalAsync = configuredJexl.eval;
    const evalSync = configuredJexl.evalSync;

    // Remove prooph board Jexl indicator before expression is passed to Jexl
    configuredJexl.eval = (expression, context) => {
      return evalAsync.call(configuredJexl, expression.replace(/^\$>/, ''), context);
    }
    configuredJexl.evalSync = (expression, context) => {
      return evalSync.call(configuredJexl, expression.replace(/^\$>/, ''), context);
    }

    configuredJexl.addFunction('count', count);
    configuredJexl.addFunction('merge', merge);
    configuredJexl.addFunction('deepMerge', deepMerge);
    configuredJexl.addFunction('uuid', generateUuuid);
    configuredJexl.addFunction('isRole', isRole);
    configuredJexl.addFunction('userAttr', getAttribute);
    configuredJexl.addFunction('pageData', getPageData);
    configuredJexl.addTransform('call', (func, ...args) => typeof func === 'function' ? func.call(func, ...args) : undefined );
    configuredJexl.addTransform('data', getPageData);
    configuredJexl.addTransform('role', isRole);
    configuredJexl.addTransform('companyRole', isCompanyRole);
    configuredJexl.addTransform('setCompanyRole', setCompanyRole);
    configuredJexl.addTransform('attr', getAttribute);
    configuredJexl.addTransform('count', count);
    configuredJexl.addTransform('merge', merge);
    configuredJexl.addTransform('deepMerge', deepMerge);
    configuredJexl.addTransform('typeof', isTypeof);

    configuredJexl.addTransform('default', getValOrDefault)

    registerStringExtensions(configuredJexl);
    registerTypeCastExtensions(configuredJexl);
    registerMathExtension(configuredJexl);
    registerArrayExtensions(configuredJexl);
    registerObjectExtension(configuredJexl);
    registerDateTimeExtensions(configuredJexl);
    registerSequenceExtension(configuredJexl);

    configuredJexl = extendJexlConfiguration(configuredJexl);
  }

  return configuredJexl;
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

const generateUuuid = () => {
  return v4();
}

const isRole = (user: User, role: UserRole | UserRole[], disableActiveRoleCheck?: boolean): boolean => {
  if(!Array.isArray(role)) {
    role = [role];
  }

  if(!disableActiveRoleCheck) {
    const activeRole = getAttribute(user, 'activeRole');

    if(activeRole) {
      return role.includes(activeRole);
    }
  }

  for (const roleItem of role) {
    if(user.roles.includes(roleItem)) {
      return true;
    }
  }

  return false;
}

const isCompanyRole = (user: User, companyId: string, role: UserRole | UserRole[]): boolean => {
  if(!Array.isArray(role)) {
    role = [role];
  }

  const companyRoles = getValueFromPath(getAttribute(user, 'companiesConfig', "{}"), `${companyId}.roles`, []);

  for (const roleItem of role) {
    if(companyRoles.includes(roleItem)) {
      return true;
    }
  }

  return false;
}

const setCompanyRole = (user: User, companyId: string, role: UserRole | UserRole[]): User => {
  if(!Array.isArray(role)) {
    role = [role];
  }

  const companyRoles = [...getValueFromPath(getAttribute(user, 'companiesConfig', "{}"), `${companyId}.roles`, [])];

  for (const roleItem of role) {
    if(!companyRoles.includes(roleItem)) {
      companyRoles.push(roleItem)
    }
  }

  let attributes = cloneDeep(user.attributes || {});

  attributes['companiesConfig'] = setValueToPath(attributes['companiesConfig'] || "{}", `${companyId}.roles`, companyRoles);

  return {...user, attributes}
}

const getAttribute = (user: User, attrName: string, notSetValue?: any): any => {
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

  const result = pageData[name];

  if(isQueryResult(result)) {
    if(!result.isSuccess) {
      return defaultValue;
    }

    return result.data;
  }

  if(isPageFormReference(result)) {
    return result.getData();
  }

  return result;
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

export default getConfiguredJexl();
