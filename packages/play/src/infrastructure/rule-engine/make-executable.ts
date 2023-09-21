import {
  isAssignVariable, isIfConditionRule, isIfNotConditionRule, isRecordEvent, PropMapping,
  Rule,
  ThenAssignVariable, ThenRecordEvent,
  ThenType
} from "@cody-engine/cody/hooks/utils/rule-engine/configuration";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {PlayEventRegistry, PlayEventRuntimeInfo} from "@cody-play/state/types";
import {makeEventFactory} from "@cody-play/infrastructure/events/make-event-factory";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";

type ExecutionContext = any;

export const makeSyncExecutable = (rules: Rule[]): (ctx: ExecutionContext) => ExecutionContext => {
  return (ctx: ExecutionContext): ExecutionContext => {
    for (const rule of rules) {
      const [result, nextRule] = execRuleSync(rule, ctx);

      if(!nextRule) {
        return result;
      }

      ctx = result;
    }

    return ctx;
  }
}

export const makeAsyncExecutable = (rules: Rule[]): (ctx: ExecutionContext) => Promise<ExecutionContext> => {
  return async (ctx: ExecutionContext): Promise<ExecutionContext> => {
    for (const rule of rules) {
      const [result, nextRule] = await execRuleAsync(rule, ctx);

      if(!nextRule) {
        return result;
      }

      ctx = result;
    }

    return ctx;
  }
}

export const execRuleSync = (rule: Rule, ctx: ExecutionContext): [ExecutionContext, boolean] => {
  if(rule.rule === "always") {
    return [execThenSync(rule.then, ctx), true];
  }

  if(isIfConditionRule(rule)) {
    if(execExprSync(rule.if, ctx)) {
      return [execThenSync(rule.then, ctx), !rule.stop];
    }
  }

  if(isIfNotConditionRule(rule)) {
    if(!execExprSync(rule.if_not, ctx)) {
      return [execThenSync(rule.then, ctx), !rule.stop];
    }
  }

  if((isIfConditionRule(rule) || isIfNotConditionRule(rule)) && rule.else) {
    return [execThenSync(rule.else, ctx), true];
  }

  throw new Error(`Unable to handle rule ${JSON.stringify(rule)}. The rule type is unknown.`);
}

export const execRuleAsync = async (rule: Rule, ctx: ExecutionContext): Promise<[ExecutionContext, boolean]> => {
  if(rule.rule === "always") {
    return [await execThenAsync(rule.then, ctx), true];
  }

  if(isIfConditionRule(rule)) {
    if(await execExprAsync(rule.if, ctx)) {
      return [await execThenAsync(rule.then, ctx), !rule.stop];
    }
  }

  if(isIfNotConditionRule(rule)) {
    if(!(await execExprAsync(rule.if_not, ctx))) {
      return [await execThenAsync(rule.then, ctx), !rule.stop];
    }
  }

  if((isIfConditionRule(rule) || isIfNotConditionRule(rule)) && rule.else) {
    return [await execThenAsync(rule.else, ctx), true];
  }

  throw new Error(`Unable to handle rule ${JSON.stringify(rule)}. The rule type is unknown.`);
}

const execThenSync = (then: ThenType, ctx: ExecutionContext): ExecutionContext => {
  switch (true) {
    case isAssignVariable(then):
      return execAssignVariableSync(then as ThenAssignVariable, ctx);
    case isRecordEvent(then):
      return execRecordEventSync(then as ThenRecordEvent, ctx);
  }
}

const execThenAsync = async (then: ThenType, ctx: ExecutionContext): Promise<ExecutionContext> => {
  switch (true) {
    case isAssignVariable(then):
      return await execAssignVariableAsync(then as ThenAssignVariable, ctx);
    case isRecordEvent(then):
      return await execRecordEventAsync(then as ThenRecordEvent, ctx);
  }
}

const execAssignVariableSync = (then: ThenAssignVariable, ctx: ExecutionContext): ExecutionContext => {
  ctx[then.assign.variable] = execMappingSync(then.assign.value, ctx);

  return ctx;
}

const execAssignVariableAsync = async (then: ThenAssignVariable, ctx: ExecutionContext): Promise<ExecutionContext> => {
  ctx[then.assign.variable] = await execMappingAsync(then.assign.value, ctx);

  return ctx;
}

const validateRecordEventContext = (then: ThenRecordEvent, ctx: ExecutionContext): PlayEventRuntimeInfo => {
  if(!ctx.eventRegistry) {
    throw new Error(`Failed to execute event recording rule. The "eventRegistry" is missing in the context. ${CONTACT_PB_TEAM}`);
  }

  if(!ctx.schemaDefinitions) {
    throw new Error(`Failed to execute event recording rule. The "schemaDefinitions" are missing in the context. ${CONTACT_PB_TEAM}`);
  }

  const evtInfo = (ctx.eventRegistry as PlayEventRegistry)[then.record.event];

  if(!evtInfo) {
    throw new Error(`Unable to record event "${then.record.event}". Its name is not registered in the registry!`);
  }

  return evtInfo;
}

const execRecordEventSync = (then: ThenRecordEvent, ctx: ExecutionContext): ExecutionContext => {
  const evtInfo = validateRecordEventContext(then, ctx);

  const factory = makeEventFactory(evtInfo, ctx.schemaDefinitions);

  const payload = execMappingSync(then.record.mapping, ctx);

  ctx['event'] = factory(payload, ctx.meta);

  return ctx;
}

const execRecordEventAsync = async (then: ThenRecordEvent, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const evtInfo = validateRecordEventContext(then, ctx);

  const factory = makeEventFactory(evtInfo, ctx.schemaDefinitions);

  const payload = await execMappingAsync(then.record.mapping, ctx);

  ctx['event'] = factory(payload, ctx.meta);

  return ctx;
}

const execMappingSync = (mapping: string | PropMapping, ctx: ExecutionContext): any => {
  if(typeof mapping === "string") {
    return execExprSync(mapping, ctx);
  }

  let propMap: Record<string, any> = {};

  for (const propName in mapping) {
    if(propName === '$merge') {
      let mergeVal = mapping['$merge'];
      if(typeof mergeVal === 'string') {
        mergeVal = [mergeVal];
      }
      mergeVal.forEach(exp => {
        propMap = {...propMap, ...execExprSync(exp, ctx)};
      })
    } else {
      propMap[propName] = execExprSync(mapping[propName] as string, ctx);
    }
  }

  return propMap;
}

const execMappingAsync = async (mapping: string | PropMapping, ctx: ExecutionContext): Promise<any> => {
  if(typeof mapping === "string") {
    return await execExprAsync(mapping, ctx);
  }

  let propMap: Record<string, any> = {};

  for (const propName in mapping) {
    if(propName === '$merge') {
      let mergeVal = mapping['$merge'];
      if(typeof mergeVal === 'string') {
        mergeVal = [mergeVal];
      }

      for (const exp of mergeVal) {
        propMap = {
          ...propMap,
          ...(await execExprAsync(exp, ctx))
        }
      }
    } else {
      propMap[propName] = await execExprAsync(mapping[propName] as string, ctx);
    }
  }

  return propMap;
}

const execExprSync = (expr: string, ctx: ExecutionContext): any => {
  return jexl.evalSync(expr, ctx);
}

const execExprAsync = async (expr: string, ctx: ExecutionContext): Promise<any> => {
  return await jexl.eval(expr, ctx);
}
