import {
  AlwaysRule,
  ConditionRule,
  isAssignVariable,
  isExecuteRules, isForEach,
  isIfConditionRule,
  isIfNotConditionRule,
  isRecordEvent, isThrowError, isTriggerCommand,
  PropMapping,
  Rule,
  ThenAssignVariable,
  ThenExecuteRules, ThenForEach,
  ThenRecordEvent, ThenThrowError, ThenTriggerCommand, ThenType
} from "./configuration";
import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {getTargetsOfType, isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {detectService} from "../detect-service";
import {Context} from "../../context";

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
    const res = convertRule(vo, ctx, rule, lines, indent);
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

  lines.push(`${indent}yield ${eventNames.propertyName}(${mapping});`);

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

  lines.push(`${indent}ctx['${then.forEach.variable}'].forEach((item: any) => {`);
  lines.push(`${indent}  ctx['item'] = item;`)

  const result = convertThen(node, ctx, then.forEach.then, rule, lines, indent + '  ', evalSync);

  if(isCodyError(result)) {
    return result;
  }

  lines.push(`${indent}})`)
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

const wrapExpression = (expr: string, evalSync = false): string => {
  return evalSync
    ? `jexl.evalSync("${expr}", ctx)`
    : `await jexl.eval("${expr}", ctx)`;
}
