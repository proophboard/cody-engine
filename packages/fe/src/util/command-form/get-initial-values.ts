import {CommandRuntimeInfo} from "@event-engine/messaging/command";
import {PropMapping} from "@app/shared/rule-engine/configuration";
import jexl from "@app/shared/jexl/get-configured-jexl";

type ExecutionContext = any;

const execExprSync = (expr: string, ctx: ExecutionContext): any => {
  return jexl.evalSync(expr, ctx);
}

const execMappingSync = (mapping: string | string[] | PropMapping | PropMapping[], ctx: ExecutionContext): any => {
  if(typeof mapping === "string") {
    return execExprSync(mapping, ctx);
  }

  if(Array.isArray(mapping)) {
    const arrMapping: any[] = [];

    mapping.forEach(mappingItem => {
      arrMapping.push(execMappingSync(mappingItem, ctx));
    })

    return arrMapping;
  }

  let propMap: Record<string, any> = {};

  for (const propName in (mapping as PropMapping)) {
    if(propName === '$merge') {
      let mergeVal = mapping['$merge'];
      if(typeof mergeVal === 'string') {
        mergeVal = [mergeVal];
      }

      if(Array.isArray(mergeVal)) {
        mergeVal.forEach(exp => {
          if(typeof exp === "string") {
            propMap = {...propMap, ...execExprSync(exp, ctx)};
          } else {
            propMap = {...propMap, ...execMappingSync(exp, ctx)};
          }
        })
      } else {
        propMap = {...propMap, ...execMappingSync(mergeVal, ctx)};
      }
    } else if (typeof mapping[propName] === "object") {
      const setVal = mapping[propName] as PropMapping | string[] | PropMapping[];

      if(Array.isArray(setVal)) {
        propMap[propName] = [];
        setVal.forEach(exp => {
          if(typeof exp === "string") {
            propMap[propName].push(execExprSync(exp, ctx)) ;
          } else {
            propMap[propName].push(execMappingSync(exp, ctx));
          }
        })
      } else {
        propMap[propName] = execMappingSync(setVal, ctx);
      }
    } else {
      propMap[propName] = execExprSync(mapping[propName] as string, ctx);
    }
  }

  return propMap;
}

export const getInitialValues = (commandInfo:  CommandRuntimeInfo, ctx: any): {[prop: string]: unknown} => {
  let values: {[prop: string]: any} = {};

  const uiSchema = commandInfo.uiSchema;

  if(!uiSchema || !uiSchema['ui:form'] || typeof uiSchema['ui:form'] !== "object") {
    return values;
  }

  const uiForm = {...uiSchema['ui:form']};

  if(uiForm.data) {
    uiForm['data:expr'] = uiForm.data;
  }

  if(uiForm['data:expr']) {
    values = execMappingSync(uiForm['data:expr'], ctx);
  }

  if(typeof values !== "object" || commandInfo.schema.type !== "object") {
    return {}
  }

  const schemaProps = commandInfo.schema.properties || {};
  const schemaPropKeys = Object.keys(schemaProps);

  const filteredValues: {[prop: string]: any} = {};

  for (const valProp in values) {
    if(schemaPropKeys.includes(valProp)) {
      filteredValues[valProp] = values[valProp];
    }
  }

  return filteredValues;
}