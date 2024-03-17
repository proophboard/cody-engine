import {
  AlwaysRule,
  ConditionRule,
  isAssignVariable,
  isCallService,
  isCountInformation,
  isDeleteInformation,
  isExecuteRules,
  isFindInformation,
  isForEach,
  isIfConditionRule,
  isIfNotConditionRule,
  isInsertInformation, isLookupUser, isLookupUsers,
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
  ThenForEach,
  ThenInsertInformation, ThenLookupUser, ThenLookupUsers,
  ThenRecordEvent,
  ThenReplaceInformation,
  ThenThrowError,
  ThenTriggerCommand,
  ThenType,
  ThenUpdateInformation,
  ThenUpsertInformation
} from "./configuration";
import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {getTargetsOfType, isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {detectService} from "../detect-service";
import {Context} from "../../context";
import {withErrorCheck} from "../error-handling";
import {getVOFromDataReference} from "@cody-engine/cody/hooks/utils/value-object/get-vo-from-data-reference";
import {voRegistryId} from "@cody-engine/cody/hooks/utils/value-object/vo-registry-id";
import {makeFilter} from "@cody-engine/cody/hooks/utils/query/make-query-resolver";
import {INFORMATION_SERVICE_NAME} from "@server/infrastructure/information-service/information-service";
import {validateResolverRules} from "@cody-engine/cody/hooks/utils/rule-engine/validate-resolver-rules";

export interface Variable {
  name: string;
  initializer: string;
}

export const convertRuleConfigToAggregateBehavior = (aggregate: Node, ctx: Context, rules: Rule[], initialVariables: Variable[], indent = '  '): string | CodyResponse => {
  if(!rules.length) {
    return '';
  }

  const lines: string[] = [];

  lines.push(`${indent}const ctx: any = deps;`);

  initialVariables.forEach(variable => lines.push(`${indent}ctx['${variable.name}'] = ${variable.initializer};`));

  for (const rule of rules) {
    lines.push("");
    const res = convertRule(aggregate, ctx, rule, lines, indent);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n");
}

export const convertRuleConfigToEventReducerRules = (event: Node, ctx: Context, rules: Rule[], indent = '  ') => {
  const lines: string[] = [];

  for (const rule of rules) {
    if(!isAssignVariable(rule.then)) {
      return {
        cody: `Rule ${JSON.stringify(rule)} of event: "${event.getName()}" is not an "assign:variable" rule.`,
        type: CodyResponseType.Error,
        details: `Event rules should only assign variables to map data from the event to the aggregate state.`,
      }
    }

    lines.push("");
    const res = convertRule(event, ctx, rule, lines, indent);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n");
}

export const convertRuleConfigToPolicyRules = (policy: Node, ctx: Context, rules: Rule[], initialVariables: Variable[], indent = '  '): string | CodyResponse => {
  if(!rules.length) {
    return '';
  }

  const lines: string[] = [];

  lines.push(`${indent}const ctx: any = deps;`);

  initialVariables.forEach(variable => lines.push(`${indent}ctx['${variable.name}'] = ${variable.initializer};`));

  for (const rule of rules) {
    lines.push("");
    const res = convertRule(policy, ctx, rule, lines, indent);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n");
}

export const convertRuleConfigToQueryResolverRules = (vo: Node, ctx: Context, rules: Rule[], indent = '  '): string | CodyResponse => {
  if(!rules.length) {
    return '';
  }

  validateResolverRules(rules);

  const lines: string[] = [];

  for (const rule of rules) {
    lines.push("");
    const res = convertRule(vo, ctx, rule, lines, indent);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n");
}

export const convertRuleConfigToValueObjectInitializeRules = (vo: Node, ctx: Context, rules: Rule[], indent = '    ') => {
  const lines: string[] = [];

  for (const rule of rules) {
    if(!isAssignVariable(rule.then)) {
      return {
        cody: `Rule ${JSON.stringify(rule)} of value object: "${vo.getName()}" is not an "assign:variable" rule.`,
        type: CodyResponseType.Error,
        details: `Value object initialize rules should only assign the value object "data" variable with initial/default values.`,
      }
    }

    lines.push("");
    const res = convertRule(vo, ctx, rule, lines, indent, true);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n");
}

export const convertRuleConfigToDynamicBreadcrumbValueGetterRules = (ui: Node, ctx: Context, rules: Rule[] | string, indent = '  ') => {
  const lines: string[] = [];

  if(typeof rules === "string") {
    rules = [
      {
        rule: "always",
        then: {
          assign: {
            variable: "value",
            value: rules
          }
        }
      }
    ]
  }

  for (const rule of rules) {
    if(!isAssignVariable(rule.then)) {
      return {
        cody: `Dynamic breadcrumb value rule ${JSON.stringify(rule)} of UI: "${ui.getName()}" is not an "assign:variable" rule.`,
        type: CodyResponseType.Error,
        details: `Dynamic breadcrumb value rules should only assign the "value" variable with data.`,
      }
    }

    lines.push("");
    const res = convertRule(ui, ctx, rule, lines, indent, true);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n");
}

export const convertRuleConfigToTableColumnValueGetterRules = (vo: Node, ctx: Context, rules: Rule[] | string, indent = '  ') => {
  const lines: string[] = [];

  if(typeof rules === "string") {
    rules = [
      {
        rule: "always",
        then: {
          assign: {
            variable: "value",
            value: rules
          }
        }
      }
    ]
  }

  for (const rule of rules) {
    if(!isAssignVariable(rule.then)) {
      return {
        cody: `Table column value rule ${JSON.stringify(rule)} of value object: "${vo.getName()}" is not an "assign:variable" rule.`,
        type: CodyResponseType.Error,
        details: `Table column value rules should only assign the column "value" variable with data from the row item.`,
      }
    }

    lines.push("");
    const res = convertRule(vo, ctx, rule, lines, indent, true);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n");
}

const convertRule = (node: Node, ctx: Context, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  switch (rule.rule) {
    case "always":
      return convertAlwaysRule(node, ctx, rule, lines, indent, evalSync);
    case "condition":
      return convertConditionRule(node, ctx, rule as ConditionRule, lines, indent, evalSync);
    default:
      return {
        cody: `I don't know how to handle a rule of type "${rule.rule}".`,
        type: CodyResponseType.Error,
        details: `Looks like a typo on your side. I can handle the following rule types: always, condition, validate`
      }
  }
}

const convertAlwaysRule = (node: Node, ctx: Context, rule: AlwaysRule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  return convertThen(node, ctx, rule.then, rule, lines, indent, evalSync);
}

const convertConditionRule = (node: Node, ctx: Context, rule: ConditionRule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  let ifCondition: string, expr: string;

  if(isIfConditionRule(rule)) {
    ifCondition = 'if (';
    expr = rule.if;
  } else if(isIfNotConditionRule(rule)) {
    ifCondition = 'if (!';
    expr = rule.if_not;
  } else {
    return {
      cody: `I don't know how to handle a condition rule that neither has an "if" nor a "if_not" condition defined: "${JSON.stringify(rule)}".`,
      type: CodyResponseType.Error,
      details: `Looks like a mistake on your side. Please check the rules of ${node.getType()}: "${node.getName()}"`
    }
  }

  lines.push(`${indent}${ifCondition}(${wrapExpression(expr, evalSync)})) {`);

  const then = convertThen(node, ctx, rule.then, rule, lines, indent + '  ', evalSync);

  if(isCodyError(then)) {
    return then;
  }

  if(rule.stop) {
    lines.push(`${indent}  return;`)
  }

  lines.push(`${indent}}`);

  if(rule.else) {
    lines.push(`${indent}else {`);

    const elseThen = convertThen(node, ctx, rule.else, rule, lines, indent + '  ', evalSync);

    if(isCodyError(elseThen)) {
      return elseThen;
    }

    lines.push(`${indent}}`);
  }

  return true;
}

const convertThen = (node: Node, ctx: Context, then: ThenType, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  switch (true) {
    case isRecordEvent(then):
      return convertThenRecordEvent(node, ctx, then as ThenRecordEvent, rule, lines, indent, evalSync);
    case isExecuteRules(then):
      return convertThenExecuteRules(node, ctx, then as ThenExecuteRules, rule, lines, indent, evalSync);
    case isAssignVariable(then):
      return convertThenAssignVariable(node, ctx, then as ThenAssignVariable, rule, lines, indent, evalSync);
    case isThrowError(then):
      return convertThenThrowError(node, ctx, then as ThenThrowError, rule, lines, indent, evalSync);
    case isTriggerCommand(then):
      return convertThenTriggerCommand(node, ctx, then as ThenTriggerCommand, rule, lines, indent, evalSync);
    case isForEach(then):
      return convertThenForEach(node, ctx, then as ThenForEach, rule, lines, indent, evalSync);
    case isCallService(then):
      return convertThenCallService(node, ctx, then as ThenCallService, rule, lines, indent, evalSync);
    case isLookupUsers(then):
      return convertThenLookupUsers(node, ctx, then as ThenLookupUsers, rule, lines, indent, evalSync);
    case isLookupUser(then):
      return convertThenLookupUser(node, ctx, then as ThenLookupUser, rule, lines, indent, evalSync);
    case isFindInformation(then):
      return convertThenFind(node, ctx, then as ThenFindInformation, rule, lines, indent, evalSync);
    case isCountInformation(then):
      return convertThenCount(node, ctx, then as ThenCountInformation, rule, lines, indent, evalSync);
    case isInsertInformation(then):
      return convertThenInsertInformation(node, ctx, then as ThenInsertInformation, rule, lines, indent, evalSync);
    case isUpsertInformation(then):
      return convertThenUpsertInformation(node, ctx, then as ThenUpsertInformation, rule, lines, indent, evalSync);
    case isUpdateInformation(then):
      return convertThenUpdateInformation(node, ctx, then as ThenUpdateInformation, rule, lines, indent, evalSync);
    case isReplaceInformation(then):
      return convertThenReplaceInformation(node, ctx, then as ThenReplaceInformation, rule, lines, indent, evalSync);
    case isDeleteInformation(then):
      return convertThenDeleteInformation(node, ctx, then as ThenDeleteInformation, rule, lines, indent, evalSync);
    default:
      return {
        cody: `I don't know the "then" part of that rule: ${JSON.stringify(rule)}.`,
        type: CodyResponseType.Error,
        details: `Looks like a typo on your side. I can only perform the actions: record: event, throw: error, assign: variable, trigger: command, perform: query, execute: rules, call: service, forEach: variable`,
      }
  }
}

const convertThenRecordEvent = (node: Node, ctx: Context, then: ThenRecordEvent, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const service = detectService(node, ctx);
  if(isCodyError(service)) {
    return service;
  }

  const eventNameParts = then.record.event.split(".");
  const eventNames = names(then.record.event);

  if(eventNameParts.length > 1) {
    return {
      cody: `Please don't use a dot in the event name of a record:event rule. I found one in the rule: ${JSON.stringify(rule)} of aggregate "${node.getName()}"`,
      type: CodyResponseType.Error,
      details: `You don't have to provide the full event name including service and aggregate. I'm using service "${service}" and aggregate name: "${node.getName()}" for that event.`
    }
  }

  const events = getTargetsOfType(node, NodeType.event, true);
  if(isCodyError(events)) {
    return events;
  }

  let eventExists = false;

  events.forEach(evt => {
    if(names(evt.getName()).className === eventNames.className) {
      eventExists = true;
    }
  });

  if(!eventExists) {
    return {
      cody: `The event "${then.record.event}" specified in the rule: ${JSON.stringify(rule)} of aggregate "${node.getName()}" is not known for that aggregate`,
      type: CodyResponseType.Error,
      details: `An aggregate can only record events that are connected to it with an arrow pointing from the aggregate to the event.`
    }
  }

  const mapping = convertMapping(node, ctx, then.record.mapping, rule, indent, evalSync);
  if(isCodyError(mapping)) {
    return mapping;
  }

  lines.push(`${indent}yield ${eventNames.propertyName}(${mapping}, ctx.meta);`);

  return true;
}

const convertThenTriggerCommand = (node: Node, ctx: Context, then: ThenTriggerCommand, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const mapping = convertMapping(node, ctx, then.trigger.mapping, rule, indent, true);
  if(isCodyError(mapping)) {
    return mapping;
  }

  const meta = then.trigger.meta? convertMapping(node, ctx, then.trigger.meta, rule, indent, true) : 'ctx["eventMeta"]';
  if(isCodyError(meta)) {
    return meta;
  }

  lines.push(`${indent}messageBox.dispatch("${then.trigger.command}", ${mapping}, ${meta}).catch(e => console.error(e));`);

  return true;
}

const convertThenExecuteRules = (node: Node, ctx: Context, then: ThenExecuteRules, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  for (const r of then.execute.rules) {
    const success = convertRule(node, ctx, r, lines, indent, evalSync);

    if(isCodyError(success)) {
      return success;
    }
  }

  return true;
}

const convertThenAssignVariable = (node: Node, ctx: Context, then: ThenAssignVariable, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const valueMapping = convertMapping(node, ctx, then.assign.value, rule, indent, evalSync);

  lines.push(`ctx['${then.assign.variable}'] = ${valueMapping}`);

  return true;
}

const convertThenThrowError = (node: Node, ctx: Context, then: ThenThrowError, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  lines.push(`throw new Error("" + (${wrapExpression(then.throw.error, evalSync)}))`);

  return true;
}

const convertThenForEach = (node: Node, ctx: Context, then: ThenForEach, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {

  lines.push(`${indent}for (const itemIndex in ctx['${then.forEach.variable}']) {`);
  lines.push(`${indent}  ctx['item'] = ctx['${then.forEach.variable}'][itemIndex];`);
  lines.push(`${indent}  ctx['_'] = ctx['item'];`);
  lines.push(`${indent}  ctx['itemIndex'] = itemIndex;`);

  const result = convertThen(node, ctx, then.forEach.then, rule, lines, indent + '  ', evalSync);

  if(isCodyError(result)) {
    return result;
  }

  lines.push(`${indent}}`)
  return true;
}

const convertThenCallService = (node: Node, ctx: Context, then: ThenCallService, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const awaitStr = then.call.async ? 'await ' : '';
  const invokeService = `${awaitStr}ctx['${then.call.service}']${(then.call.method? '.'+then.call.method : '')}`
    + (then.call.arguments? '(' + withErrorCheck(convertMapping, [node, ctx, then.call.arguments, rule, indent + '  ', evalSync]) +')' : '()') + ';';


  if(then.call.result.mapping) {
    lines.push(`${indent}ctx['${then.call.service}__Result'] = ${invokeService}`);
    lines.push(`${indent}ctx['__data'] = ctx['data'];`);
    lines.push(`${indent}ctx['data'] = ctx['${then.call.service}__Result'];`);
    lines.push(`${indent}ctx['${then.call.result.variable}'] = ${withErrorCheck(convertMapping, [node, ctx, then.call.result.mapping, rule, indent + '  ', evalSync])};`);
    lines.push(`${indent}ctx['data'] = ctx['__data'];`);
    lines.push(`${indent}delete ctx['__data'];`);
    lines.push(`${indent}delete ctx['${then.call.service}__Result'];`)
  } else {
    lines.push(`${indent}ctx['${then.call.result.variable}'] = ${invokeService}`);
  }

  return true;
}

const convertThenLookupUsers = (node: Node, ctx: Context, then: ThenLookupUsers, rule: Rule, lines: string[], indent = '', evalSync = false ): boolean | CodyResponse => {
  if(evalSync) {
    return {
      cody: `Lookup users rules can only be used in async components like query resolvers, policies, and command handlers. Please check rule configuration of ${node.getName()}`,
      type: CodyResponseType.Error
    }
  }

  const variable = then.lookup.users.variable || 'users';


  lines.push(`${indent}if(!ctx['AuthService']) { throw new Error('Cannot lookup users. "AuthService" is missing in the query dependencies! Please check the prooph board configuration.'); }`)

  lines.push(`${indent}ctx['${variable}'] = await ctx['AuthService'].find(`);
  makeFilter(then.lookup.users.filter, lines, indent + '  ');
  if(typeof then.lookup.users.skip !== 'undefined') {
    lines.push(`${indent}  , ${then.lookup.users.skip}`);
  }
  if(typeof then.lookup.users.limit !== 'undefined') {
    lines.push(`${indent}  , ${then.lookup.users.limit}`);
  }
  if(then.lookup.users.orderBy) {
    lines.push(`${indent}  , ${JSON.stringify(then.lookup.users.orderBy)}`);
  }

  lines.push(`${indent});`);

  return true;
}

const convertThenLookupUser = (node: Node, ctx: Context, then: ThenLookupUser, rule: Rule, lines: string[], indent = '', evalSync = false ): boolean | CodyResponse => {
  if(evalSync) {
    return {
      cody: `Lookup user rules can only be used in async components like query resolvers, policies, and command handlers. Please check rule configuration of ${node.getName()}`,
      type: CodyResponseType.Error
    }
  }

  lines.push(`${indent}if(!ctx['AuthService']) { throw new Error('Cannot lookup user. "AuthService" is missing in the query dependencies! Please check the prooph board configuration.'); }`)

  const variable = then.lookup.variable || 'user';

  lines.push(`${indent}ctx['${variable}'] = await ctx['AuthService'].get(${wrapExpression(then.lookup.user)});`);

  return true;
}

const convertThenFind = (node: Node, ctx: Context, then: ThenFindInformation, rule: Rule, lines: string[], indent = '', evalSync = false ): boolean | CodyResponse => {
  if(evalSync) {
    return {
      cody: `Find information rules can only be used in query resolvers. Please check rule configuration of ${node.getName()}`,
      type: CodyResponseType.Error
    }
  }

  const vo = withErrorCheck(getVOFromDataReference, [then.find.information, node, ctx]);
  const registryId = withErrorCheck(voRegistryId, [vo, ctx]);

  const variable = then.find.variable || 'information';

  lines.push(`${indent}ctx['${variable}'] = await ctx['${INFORMATION_SERVICE_NAME}'].find('${registryId}',`);
  makeFilter(then.find.filter, lines, indent + '  ');
  if(typeof then.find.skip !== 'undefined') {
    lines.push(`${indent}  , ${then.find.skip}`);
  }
  if(typeof then.find.limit !== 'undefined') {
    lines.push(`${indent}  , ${then.find.limit}`);
  }
  if(then.find.orderBy) {
    lines.push(`${indent}  , ${JSON.stringify(then.find.orderBy)}`);
  }

  lines.push(`${indent});`);

  return true;
}

const convertThenCount = (node: Node, ctx: Context, then: ThenCountInformation, rule: Rule, lines: string[], indent = '', evalSync = false ): boolean | CodyResponse => {
  if(evalSync) {
    return {
      cody: `Count information rules can only be used in query resolvers. Please check rule configuration of ${node.getName()}`,
      type: CodyResponseType.Error
    }
  }

  const vo = withErrorCheck(getVOFromDataReference, [then.count.information, node, ctx]);
  const registryId = withErrorCheck(voRegistryId, [vo, ctx]);

  const variable = then.count.variable || 'information';

  lines.push(`${indent}ctx['${variable}'] = await ctx['${INFORMATION_SERVICE_NAME}'].count('${registryId}',`);
  makeFilter(then.count.filter, lines, indent + '  ');

  lines.push(`${indent});`);

  return true;
}

const convertThenInsertInformation = (node: Node, ctx: Context, then: ThenInsertInformation, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const awaitStr = evalSync ? 'await ' : '';
  const vo = withErrorCheck(getVOFromDataReference, [then.insert.information, node, ctx]);
  const registryId = withErrorCheck(voRegistryId, [vo, ctx]);

  let invokeInfoService = `${awaitStr}ctx['${INFORMATION_SERVICE_NAME}'].insert('${registryId}', ${wrapExpression(then.insert.id, evalSync)}, `
    + withErrorCheck(convertMapping, [node, ctx, then.insert.set, rule, indent + '  ', evalSync]);

  if(then.insert.meta) {
    invokeInfoService += ', ' + withErrorCheck(convertMapping, [node, ctx, then.insert.meta, rule, indent + '  ', evalSync]);
  }

  if(then.insert.version) {
    invokeInfoService += ', ' + `${then.insert.version}`;
  }

  invokeInfoService += `);`;

  lines.push(`${indent}${invokeInfoService}`);

  return true;
}

const convertThenUpsertInformation = (node: Node, ctx: Context, then: ThenUpsertInformation, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const awaitStr = evalSync ? 'await ' : '';
  const vo = withErrorCheck(getVOFromDataReference, [then.upsert.information, node, ctx]);
  const registryId = withErrorCheck(voRegistryId, [vo, ctx]);

  let invokeInfoService = `${awaitStr}ctx['${INFORMATION_SERVICE_NAME}'].upsert('${registryId}', ${wrapExpression(then.upsert.id, evalSync)}, `
    + withErrorCheck(convertMapping, [node, ctx, then.upsert.set, rule, indent + '  ', evalSync]);

  if(then.upsert.meta) {
    invokeInfoService += ', ' + withErrorCheck(convertMapping, [node, ctx, then.upsert.meta, rule, indent + '  ', evalSync]);
  }

  if(then.upsert.version) {
    invokeInfoService += ', ' + `${then.upsert.version}`;
  }

  invokeInfoService += `);`;

  lines.push(`${indent}${invokeInfoService}`);

  return true;
}

const convertThenUpdateInformation = (node: Node, ctx: Context, then: ThenUpdateInformation, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const awaitStr = evalSync ? 'await ' : '';
  const vo = withErrorCheck(getVOFromDataReference, [then.update.information, node, ctx]);
  const registryId = withErrorCheck(voRegistryId, [vo, ctx]);

  lines.push(`${indent}${awaitStr}ctx['${INFORMATION_SERVICE_NAME}'].update('${registryId}',`);
  makeFilter(then.update.filter, lines, indent + '  ', ',');
  lines.push(withErrorCheck(convertMapping, [node, ctx, then.update.set, rule, indent + '  ', evalSync]));
  if(then.update.meta) {
    lines.push(`${indent}  , ` + withErrorCheck(convertMapping, [node, ctx, then.update.meta, rule, indent + '  ', evalSync]));
  }
  if(then.update.version) {
    lines.push(`${indent}  , ${then.update.version}`)
  }

  lines.push(`${indent});`);

  return true;
}

const convertThenReplaceInformation = (node: Node, ctx: Context, then: ThenReplaceInformation, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const awaitStr = evalSync ? 'await ' : '';
  const vo = withErrorCheck(getVOFromDataReference, [then.replace.information, node, ctx]);
  const registryId = withErrorCheck(voRegistryId, [vo, ctx]);

  lines.push(`${indent}${awaitStr}ctx['${INFORMATION_SERVICE_NAME}'].replace('${registryId}',`);
  makeFilter(then.replace.filter, lines, indent + '  ', ',');
  lines.push(withErrorCheck(convertMapping, [node, ctx, then.replace.set, rule, indent + '  ', evalSync]));

  if(then.replace.meta) {
    lines.push(`${indent}  , ` + withErrorCheck(convertMapping, [node, ctx, then.replace.meta, rule, indent + '  ', evalSync]));
  }
  if(then.replace.version) {
    lines.push(`${indent}  , ${then.replace.version}`)
  }

  lines.push(`${indent});`);

  return true;
}

const convertThenDeleteInformation = (node: Node, ctx: Context, then: ThenDeleteInformation, rule: Rule, lines: string[], indent = '', evalSync = false): boolean | CodyResponse => {
  const awaitStr = evalSync ? 'await ' : '';
  const vo = withErrorCheck(getVOFromDataReference, [then.delete.information, node, ctx]);
  const registryId = withErrorCheck(voRegistryId, [vo, ctx]);

  lines.push(`${indent}${awaitStr}ctx['${INFORMATION_SERVICE_NAME}'].delete('${registryId}',`);
  makeFilter(then.delete.filter, lines, indent + '  ');

  lines.push(`${indent});`)

  return true;
}

const convertMapping = (node: Node, ctx: Context, mapping: string | PropMapping, rule: Rule, indent = '', evalSync = false): string | CodyResponse => {
  if(typeof mapping === "string") {
    return wrapExpression(mapping, evalSync);
  }

  let propMap = `{\n`;

  for (const propName in mapping) {
    if(propName === '$merge') {
      let mergeVal = mapping['$merge'];
      if(typeof mergeVal === 'string') {
        mergeVal = [mergeVal];
      }
      mergeVal.forEach(exp => {
        propMap += `${indent}  ...${wrapExpression(exp, evalSync)},\n`
      })
    } else {
      propMap += `${indent}  "${propName}": ${wrapExpression(mapping[propName] as string, evalSync)},\n`
    }
  }

  propMap += `${indent}}`;

  return propMap;
}

export const wrapExpression = (expr: string, evalSync = false): string => {
  return evalSync
    ? `jexl.evalSync("${expr}", ctx)`
    : `await jexl.eval("${expr}", ctx)`;
}
