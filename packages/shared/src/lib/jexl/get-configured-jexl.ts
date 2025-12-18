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
import {registerMixedExtensions} from "@app/shared/jexl/mixed-extension/register";
import {singleQuotedMustacheToConcat} from "@app/shared/jexl/template-extension/single-quoted-template";


let configuredJexl: Jexl;

const getConfiguredJexl = (): Jexl => {
  if(!configuredJexl) {
    configuredJexl = new jexl.Jexl() as Jexl;

    const evalAsync = configuredJexl.eval;
    const evalSync = configuredJexl.evalSync;

    // Remove prooph board Jexl indicator before expression is passed to Jexl
    configuredJexl.eval = (expression, context) => {
      expression = singleQuotedMustacheToConcat(expression.replace(/^\$>/, ''));
      return evalAsync.call(configuredJexl, expression, context);
    }
    configuredJexl.evalSync = (expression, context) => {
      expression = singleQuotedMustacheToConcat(expression.replace(/^\$>/, ''));
      return evalSync.call(configuredJexl, expression, context);
    }



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




    registerMixedExtensions(configuredJexl);
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

  if(typeof pageData[name] === "undefined") {
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

export default getConfiguredJexl();
