import {PropMapping} from "@app/shared/rule-engine/configuration";
import jexl from "@app/shared/jexl/get-configured-jexl";

export const execMappingSync = (mapping: string | string[] | PropMapping | PropMapping[], ctx: any): any => {
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


export const execMappingAsync = async (mapping: string | string[] | PropMapping | PropMapping[], ctx: any): Promise<any> => {
  if(typeof mapping === "string") {
    return await execExprAsync(mapping, ctx);
  }

  if(Array.isArray(mapping)) {
    const arrMapping: any[] = [];

    for (const mappingItem of mapping) {
      arrMapping.push(await execMappingAsync(mappingItem, ctx));
    }

    return arrMapping;
  }


  let propMap: Record<string, any> = {};

  for (const propName in mapping) {
    if(propName === '$merge') {
      let mergeVal = mapping['$merge'];
      if(typeof mergeVal === 'string') {
        mergeVal = [mergeVal];
      }

      if(Array.isArray(mergeVal)) {
        for (const exp of mergeVal) {
          if(typeof exp === "string") {
            propMap = {
              ...propMap,
              ...(await execExprAsync(exp, ctx))
            }
          } else {
            propMap = {
              ...propMap,
              ...(await execMappingAsync(exp, ctx))
            }
          }
        }
      } else {
        propMap = {
          ...propMap,
          ...(await execMappingAsync(mergeVal, ctx))
        }
      }
    } else if (typeof mapping[propName] === "object") {
      const setVal = mapping[propName] as PropMapping | string[] | PropMapping[];

      if(Array.isArray(setVal)) {
        propMap[propName] = [];
        for (const exp of setVal) {
          if(typeof exp === "string") {
            propMap[propName].push(await execExprAsync(exp, ctx));
          } else {
            propMap[propName].push(await execMappingAsync(exp, ctx));
          }
        }
      } else {
        propMap[propName] = await execMappingAsync(setVal, ctx);
      }
    } else {
      propMap[propName] = await execExprAsync(mapping[propName] as string, ctx);
    }
  }

  return propMap;
}

export const execExprSync = (expr: string, ctx: any): any => {
  return jexl.evalSync(expr, ctx);
}

export const execExprAsync = async (expr: string, ctx: any): Promise<any> => {
  return await jexl.eval(expr, ctx);
}
