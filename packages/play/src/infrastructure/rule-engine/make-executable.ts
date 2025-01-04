import {
  isAssignVariable,
  isCallService,
  isCountInformation,
  isDeleteInformation,
  isExecuteRules,
  isFindInformation,
  isFindInformationById,
  isFindOneInformation,
  isFindOnePartialInformation,
  isFindPartialInformation,
  isFindPartialInformationById,
  isForEach,
  isIfConditionRule,
  isIfNotConditionRule,
  isInsertInformation,
  isLogMessage,
  isLookupUser,
  isLookupUsers,
  isRecordEvent,
  isReplaceInformation,
  isThrowError,
  isTriggerCommand,
  isUpdateInformation,
  isUpsertInformation,
  PropMapping,
  Rule,
  ThenAssignVariable,
  ThenCallService,
  ThenCountInformation,
  ThenDeleteInformation,
  ThenExecuteRules,
  ThenFindInformation,
  ThenFindInformationById,
  ThenFindOneInformation,
  ThenFindOnePartialInformation,
  ThenFindPartialInformation, ThenFindPartialInformationById,
  ThenForEach,
  ThenInsertInformation,
  ThenLogMessage,
  ThenLookupUser,
  ThenLookupUsers,
  ThenRecordEvent,
  ThenReplaceInformation,
  ThenThrowError,
  ThenTriggerCommand,
  ThenType,
  ThenUpdateInformation,
  ThenUpsertInformation
} from "@app/shared/rule-engine/configuration";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {
  PlayCommandRegistry,
  PlayCommandRuntimeInfo,
  PlayEventRegistry,
  PlayEventRuntimeInfo
} from "@cody-play/state/types";
import {makeEventFactory} from "@cody-play/infrastructure/events/make-event-factory";
import {CONTACT_PB_TEAM} from "@cody-play/infrastructure/error/message";
import {makeCommandFactory} from "@cody-play/infrastructure/commands/make-command-factory";
import {ValidationError} from "ajv";
import {
  INFORMATION_SERVICE_NAME,
  InformationService
} from "@event-engine/infrastructure/information-service/information-service";
import {makeFilter, makeFiltersInPartialSelect} from "@cody-play/queries/make-filters";
import {mapOrderBy} from "@cody-engine/cody/hooks/utils/query/map-order-by";
import {AuthService} from "@event-engine/infrastructure/auth-service/auth-service";
import {Logger, LOGGER_SERVICE_NAME} from "@app/shared/utils/logger/Logger";

type ExecutionContext = any;

export const CTX_RECORDED_EVENTS_KEY = '$recordedEvents';

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

  if((isIfConditionRule(rule) || isIfNotConditionRule(rule))) {
    return [ctx, true];
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

  if((isIfConditionRule(rule) || isIfNotConditionRule(rule))) {
    return [ctx, true];
  }

  throw new Error(`Unable to handle rule ${JSON.stringify(rule)}. The rule type is unknown.`);
}

const execThenSync = (then: ThenType, ctx: ExecutionContext): ExecutionContext => {
  switch (true) {
    case isAssignVariable(then):
      return execAssignVariableSync(then as ThenAssignVariable, ctx);
    case isRecordEvent(then):
      return execRecordEventSync(then as ThenRecordEvent, ctx);
    case isExecuteRules(then):
      return execExecuteRulesSync(then as ThenExecuteRules, ctx);
    case isThrowError(then):
      execThrowError(then as ThenThrowError, ctx);
      return ctx;
    case isLogMessage(then):
      execLogMessage(then as ThenLogMessage, ctx);
      return ctx;
    case isForEach(then):
      return execForEachSync(then as ThenForEach, ctx);
    case isTriggerCommand(then):
      return execTriggerCommandSync(then as ThenTriggerCommand, ctx);
    case isCallService(then):
      return execCallServiceSync(then as ThenCallService, ctx);
    case isLookupUser(then):
    case isLookupUsers(then):
      throw new Error(`User lookup rules can only be used in asynchronous contexts like query resolvers, automations, services or projections`);
    case isFindInformation(then):
    case isFindOneInformation(then):
    case isFindInformationById(then):
    case isFindPartialInformation(then):
    case isFindOnePartialInformation(then):
    case isFindPartialInformationById(then):
    case isCountInformation(then):
      throw new Error(`Information find rules can only be used in asynchronous contexts like query resolvers, automations, services or projections`);
    case isInsertInformation(then):
    case isUpsertInformation(then):
    case isUpdateInformation(then):
    case isReplaceInformation(then):
    case isDeleteInformation(then):
      throw new Error(`Information update rules can only be used in asynchronous contexts like policies or processors`);
  }

  throw new Error(`Cannot execute rule. The "then" part is unknown: ${JSON.stringify(then)}`);
}

const execThenAsync = async (then: ThenType, ctx: ExecutionContext): Promise<ExecutionContext> => {
  switch (true) {
    case isAssignVariable(then):
      return await execAssignVariableAsync(then as ThenAssignVariable, ctx);
    case isRecordEvent(then):
      return await execRecordEventAsync(then as ThenRecordEvent, ctx);
    case isExecuteRules(then):
      return await execExecuteRulesAsync(then as ThenExecuteRules, ctx);
    case isThrowError(then):
      execThrowError(then as ThenThrowError, ctx);
      return ctx;
    case isLogMessage(then):
      execLogMessage(then as ThenLogMessage, ctx);
      return ctx;
    case isForEach(then):
      return execForEachAsync(then as ThenForEach, ctx);
    case isTriggerCommand(then):
      return await execTriggerCommandAsync(then as ThenTriggerCommand, ctx);
    case isCallService(then):
      return await execCallServiceAsync(then as ThenCallService, ctx);
    case isLookupUsers(then):
      return await execLookupUsers(then as ThenLookupUsers, ctx);
    case isLookupUser(then):
      return await execLookupUser(then as ThenLookupUser, ctx);
    case isFindInformation(then):
      return await execFindInformation(then as ThenFindInformation, ctx);
    case isFindOneInformation(then):
      return await execFindOneInformation(then as ThenFindOneInformation, ctx);
    case isFindInformationById(then):
      return await execFindInformationById(then as ThenFindInformationById, ctx);
    case isFindPartialInformation(then):
      return await execFindPartialInformation(then as ThenFindPartialInformation, ctx);
    case isFindOnePartialInformation(then):
      return await execFindOnePartialInformation(then as ThenFindOnePartialInformation, ctx);
    case isFindPartialInformationById(then):
      return await execFindPartialInformationById(then as ThenFindPartialInformationById, ctx);
    case isCountInformation(then):
      return await execCountInformation(then as ThenCountInformation, ctx);
    case isInsertInformation(then):
      return await execInsertInformationAsync(then as ThenInsertInformation, ctx);
    case isUpsertInformation(then):
      return await execUpsertInformationAsync(then as ThenUpsertInformation, ctx);
    case isUpdateInformation(then):
      return await execUpdateInformationAsync(then as ThenUpdateInformation, ctx);
    case isReplaceInformation(then):
      return await execReplaceInformationAsync(then as ThenReplaceInformation, ctx);
    case isDeleteInformation(then):
      return await execDeleteInformationAsync(then as ThenDeleteInformation, ctx);
  }

  throw new Error(`Cannot execute rule. The "then" part is unknown: ${JSON.stringify(then)}`);
}

const validateTriggerCommandContext = (then: ThenTriggerCommand, ctx: ExecutionContext): PlayCommandRuntimeInfo => {
  if(!ctx.commandRegistry) {
    throw new Error(`Failed to execute trigger command rule. "commandRegistry" are missing in the context. ${CONTACT_PB_TEAM}`);
  }

  if(!ctx.schemaDefinitions) {
    throw new Error(`Failed to execute trigger command rule. The "schemaDefinitions" are missing in the context. ${CONTACT_PB_TEAM}`);
  }

  const cmdInfo = (ctx.commandRegistry as PlayCommandRegistry)[then.trigger.command];

  if(!cmdInfo) {
    throw new Error(`Unable to trigger command "${then.trigger.command}". Its name is not registered in the registry!`);
  }

  return cmdInfo;
}

const execForEachSync = (then: ThenForEach, ctx: ExecutionContext): ExecutionContext => {
  if(ctx[then.forEach.variable] && Array.isArray(ctx[then.forEach.variable])) {
    for (const itemIndex in ctx[then.forEach.variable]) {
      ctx['item'] = ctx[then.forEach.variable][itemIndex];
      ctx['_'] = ctx['item'];
      ctx['itemIndex'] = itemIndex;

      ctx = execThenSync(then.forEach.then, ctx);
    }
  }

  return ctx;
}

const execForEachAsync = async (then: ThenForEach, ctx: ExecutionContext): Promise<ExecutionContext> => {
  if(ctx[then.forEach.variable] && Array.isArray(ctx[then.forEach.variable])) {
    for (const itemIndex in ctx[then.forEach.variable]) {
      ctx['item'] = ctx[then.forEach.variable][itemIndex];
      ctx['_'] = ctx['item'];
      ctx['itemIndex'] = itemIndex;

      ctx = await execThenAsync(then.forEach.then, ctx);
    }
  }

  return ctx;
}

const argsToArrayOrUndefined = (args?: any): any[] | undefined => {
  if(typeof args === "undefined") {
    return undefined;
  }

  if(Array.isArray(args)) {
    return args;
  }

  return [args];
}

const execCallServiceSync = (then: ThenCallService, ctx: ExecutionContext): ExecutionContext => {
  const service = ctx[then.call.service];

  if(!service) {
    throw new Error(`Cannot execute rule: call service "${then.call.service}". Service not found. Please check your dependency configuration for spelling mistakes e.g. if you use an alias.`);
  }

  const method = then.call.method
    ? (args?: object) => {return ctx[then.call.service][then.call.method!].apply(service, argsToArrayOrUndefined(args))}
    : (args?: object) => {return ctx[then.call.service].apply(service, argsToArrayOrUndefined(args))};

  const result = then.call.arguments ? method(execMappingSync(then.call.arguments, ctx)) : method();

  if(then.call.result && then.call.result.mapping) {
    ctx[`__data`] = ctx['data'];
    ctx['data'] = result;
    ctx[then.call.result.variable] = execMappingSync(then.call.result.mapping, ctx);
    ctx['data'] = ctx['__data'];
    delete ctx['__data'];
  } else if (then.call.result) {
    ctx[then.call.result.variable] = result;
  }

  return ctx;
}

const execCallServiceAsync = async (then: ThenCallService, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const service = ctx[then.call.service];

  if(!service) {
    throw new Error(`Cannot execute rule: call service "${then.call.service}". Service not found. Please check your dependency configuration for spelling mistakes e.g. if you use an alias.`);
  }

  const method = then.call.method
    ? async (args?: object) => {return await ctx[then.call.service][then.call.method!].apply(service, argsToArrayOrUndefined(args))}
    : async (args?: object) => {return await ctx[then.call.service].apply(service, argsToArrayOrUndefined(args))};

  const result = then.call.arguments ? await method(await execMappingAsync(then.call.arguments, ctx)) : await method();

  if(then.call.result && then.call.result.mapping) {
    ctx[`__data`] = ctx['data'];
    ctx['data'] = result;
    ctx[then.call.result.variable] = await execMappingAsync(then.call.result.mapping, ctx);
    ctx['data'] = ctx['__data'];
    delete ctx['__data'];
  } else if (then.call.result) {
    ctx[then.call.result.variable] = result;
  }

  return ctx;
}

const execLookupUsers = async (then: ThenLookupUsers, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const authService: AuthService = ctx['AuthService'];

  if(!authService) {
    throw new Error(`Cannot execute rule: lookup users. "AuthService" not found. Please check your dependency configuration for spelling mistakes e.g. if you use an alias.`);
  }

  const variable = then.lookup.users.variable || 'users';

  ctx[variable] = await authService.find(
    makeFilter(then.lookup.users.filter, ctx),
    then.lookup.users.skip,
    then.lookup.users.limit,
    then.lookup.users.orderBy ? mapOrderBy(then.lookup.users.orderBy) : undefined
  );

  return ctx;
}

const execLookupUser = async (then: ThenLookupUser, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const authService: AuthService = ctx['AuthService'];

  if(!authService) {
    throw new Error(`Cannot execute rule: lookup users. "AuthService" not found. Please check your dependency configuration for spelling mistakes e.g. if you use an alias.`);
  }

  const variable = then.lookup.variable || 'user';

  ctx[variable] = authService.get(await execExprAsync(then.lookup.user, ctx));

  return ctx;
}

const execFindInformation = async (then: ThenFindInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: find information "${then.find.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const variable = then.find.variable || 'information';

  ctx[variable] = await infoService.find(
    then.find.information,
    makeFilter(then.find.filter, ctx),
    then.find.skip,
    then.find.limit,
    then.find.orderBy ? mapOrderBy(then.find.orderBy) : undefined
  );

  return ctx;
}

const execFindOneInformation = async (then: ThenFindOneInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: find one information "${then.findOne.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const variable = then.findOne.variable || 'information';

  ctx[variable] = await infoService.findOne(
    then.findOne.information,
    makeFilter(then.findOne.filter, ctx)
  );

  return ctx;
}

const execFindInformationById = async (then: ThenFindInformationById, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: find information by id "${then.findById.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const variable = then.findById.variable || 'information';

  ctx[variable] = await infoService.findById(
    then.findById.information,
    then.findById.id
  );

  return ctx;
}

const execFindPartialInformation = async (then: ThenFindPartialInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: find partial information "${then.findPartial.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const variable = then.findPartial.variable || 'information';

  ctx[variable] = await infoService.findPartial(
    then.findPartial.information,
    makeFiltersInPartialSelect(then.findPartial.select, ctx),
    makeFilter(then.findPartial.filter, ctx),
    then.findPartial.skip,
    then.findPartial.limit,
    then.findPartial.orderBy ? mapOrderBy(then.findPartial.orderBy) : undefined
  );

  return ctx;
}

const execFindOnePartialInformation = async (then: ThenFindOnePartialInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: find one partial information "${then.findOnePartial.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const variable = then.findOnePartial.variable || 'information';

  ctx[variable] = await infoService.findPartial(
    then.findOnePartial.information,
    makeFiltersInPartialSelect(then.findOnePartial.select, ctx),
    makeFilter(then.findOnePartial.filter, ctx)
  );

  return ctx;
}

const execFindPartialInformationById = async (then: ThenFindPartialInformationById, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: find partial information by id "${then.findPartialById.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const variable = then.findPartialById.variable || 'information';

  ctx[variable] = await infoService.findPartialById(
    then.findPartialById.information,
    then.findPartialById.id,
    makeFiltersInPartialSelect(then.findPartialById.select, ctx)
  );

  return ctx;
}

const execCountInformation = async (then: ThenCountInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: count information "${then.count.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const variable = then.count.variable || 'information';

  ctx[variable] = await infoService.count(then.count.information, makeFilter(then.count.filter, ctx));

  return ctx;
}

const execInsertInformationAsync = async (then: ThenInsertInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: insert information "${then.insert.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const data = await execMappingAsync(then.insert.set, ctx);

  const metadata = then.insert.meta? await execMappingAsync(then.insert.meta, ctx) : undefined;

  await infoService.insert(then.insert.information, await execExprAsync(then.insert.id, ctx), data, metadata, then.insert.version);

  return ctx;
}

const execUpsertInformationAsync = async (then: ThenUpsertInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: upsert information "${then.upsert.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const data = await execMappingAsync(then.upsert.set, ctx);

  const metadata = then.upsert.meta? await execMappingAsync(then.upsert.meta, ctx) : undefined;

  await infoService.upsert(then.upsert.information, await execExprAsync(then.upsert.id, ctx), data, metadata, then.upsert.version);

  return ctx;
}

const execUpdateInformationAsync = async (then: ThenUpdateInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: update information "${then.update.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const filter = makeFilter(then.update.filter, ctx);
  const data = await execMappingAsync(then.update.set, ctx);
  const metadata = then.update.meta? await execMappingAsync(then.update.meta, ctx) : undefined;

  await infoService.update(then.update.information, filter, data, metadata, then.update.version);

  return ctx;
}

const execReplaceInformationAsync = async (then: ThenReplaceInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: replace information "${then.replace.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const filter = makeFilter(then.replace.filter, ctx);
  const data = await execMappingAsync(then.replace.set, ctx);
  const metadata = then.replace.meta? await execMappingAsync(then.replace.meta, ctx) : undefined;

  await infoService.replace(then.replace.information, filter, data, metadata, then.replace.version);

  return ctx;
}

const execDeleteInformationAsync = async (then: ThenDeleteInformation, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const infoService: InformationService = ctx[INFORMATION_SERVICE_NAME];

  if(!infoService) {
    throw new Error(`Cannot execute rule: delete information "${then.delete.information}". ${INFORMATION_SERVICE_NAME} not found. This is a bug. Please contact the prooph board team.`);
  }

  const filter = makeFilter(then.delete.filter, ctx);

  await infoService.delete(then.delete.information, filter);

  return ctx;
}

const execTriggerCommandSync = (then: ThenTriggerCommand, ctx: ExecutionContext): ExecutionContext => {
  const cmdInfo = validateTriggerCommandContext(then, ctx);

  const factory = makeCommandFactory(cmdInfo, ctx.schemaDefinitions);

  const payload = execMappingSync(then.trigger.mapping, ctx);

  const commands = ctx['commands'] || [];
  commands.push(factory(payload, ctx.meta));
  ctx['commands'] = commands;

  return ctx;
}

const execTriggerCommandAsync = async (then: ThenTriggerCommand, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const cmdInfo = validateTriggerCommandContext(then, ctx);

  const factory = makeCommandFactory(cmdInfo, ctx.schemaDefinitions);

  const payload = await execMappingAsync(then.trigger.mapping, ctx);

  const commands = ctx['commands'] || [];
  try {
    commands.push(factory(payload, ctx.meta));
  } catch (e) {
    if(e instanceof ValidationError) {
      throw new Error(`Command payload validation failed for command "${cmdInfo.desc.name}" and payload "${JSON.stringify(payload)}" with error: ` + JSON.stringify(e.errors, null, 2));
    }

    throw e;
  }

  ctx['commands'] = commands;

  return ctx;
}

const execThrowError = (then: ThenThrowError, ctx: ExecutionContext) => {
  throw new Error(jexl.evalSync(then.throw.error, ctx));
}

const execLogMessage = (then: ThenLogMessage, ctx: ExecutionContext) => {
  const logger: Logger = ctx[LOGGER_SERVICE_NAME] || console;

  const logLevel = then.log.logLevel || 'info';

  const msgs = Array.isArray(then.log.msg) ? then.log.msg : [then.log.msg];

  const contextualMsgs = msgs.map(msg => jexl.evalSync(msg, ctx));

  switch (logLevel) {
    case "info":
      logger.log(...contextualMsgs);
      break;
    case "error":
      logger.error(...contextualMsgs);
      break;
    case "warn":
      logger.warn(...contextualMsgs);
      break;
  }
}

const execExecuteRulesSync = (then: ThenExecuteRules, ctx: ExecutionContext): ExecutionContext => {
  for (const r of then.execute.rules) {
    const [changedCtx, nextRule] = execRuleSync(r, ctx);

    if(!nextRule) {
      return changedCtx;
    }

    ctx = changedCtx;
  }

  return ctx;
}

const execExecuteRulesAsync = async (then: ThenExecuteRules, ctx: ExecutionContext): Promise<ExecutionContext> => {
  for (const r of then.execute.rules) {
    const [changedCtx, nextRule] = await execRuleAsync(r, ctx);

    if(!nextRule) {
      return changedCtx;
    }

    ctx = changedCtx;
  }

  return ctx;
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

  const events = ctx[CTX_RECORDED_EVENTS_KEY] || [];

  events.push(factory(payload, ctx.meta));

  ctx[CTX_RECORDED_EVENTS_KEY] = events;

  return ctx;
}

const execRecordEventAsync = async (then: ThenRecordEvent, ctx: ExecutionContext): Promise<ExecutionContext> => {
  const evtInfo = validateRecordEventContext(then, ctx);

  const factory = makeEventFactory(evtInfo, ctx.schemaDefinitions);

  const payload = await execMappingAsync(then.record.mapping, ctx);

  const meta = then.record.meta ? await execMappingAsync(then.record.meta, ctx) : {};

  const events = ctx[CTX_RECORDED_EVENTS_KEY] || [];

  events.push(factory(payload, {...ctx.meta, ...meta}));

  ctx[CTX_RECORDED_EVENTS_KEY] = events;

  return ctx;
}

export const execMappingSync = (mapping: string | string[] | PropMapping | PropMapping[], ctx: ExecutionContext): any => {
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

export const execMappingAsync = async (mapping: string | string[] | PropMapping | PropMapping[], ctx: ExecutionContext): Promise<any> => {
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

const execExprSync = (expr: string, ctx: ExecutionContext): any => {
  return jexl.evalSync(expr, ctx);
}

const execExprAsync = async (expr: string, ctx: ExecutionContext): Promise<any> => {
  return await jexl.eval(expr, ctx);
}
