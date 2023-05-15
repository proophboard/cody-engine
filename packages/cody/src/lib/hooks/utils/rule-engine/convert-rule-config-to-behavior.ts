import {AlwaysRule, PropMapping, Rule, ThenRecordEvent} from "./configuration";
import {CodyResponse, CodyResponseType, Node, NodeType} from "@proophboard/cody-types";
import {getTargetsOfType, isCodyError} from "@proophboard/cody-utils";
import {names} from "@event-engine/messaging/helpers";
import {detectService} from "../detect-service";
import {Context} from "../../context";

export interface Variable {
  name: string;
  initializer: string;
}

export const convertRuleConfigToAggregateBehavior = (aggregate: Node, ctx: Context, rules: Rule[], initialVariables: Variable[]): string | CodyResponse => {
  if(!rules.length) {
    return '';
  }

  const lines: string[] = [];

  lines.push(`const ctx: any = {};`);

  initialVariables.forEach(variable => lines.push(`ctx['${variable.name}'] = ${variable.initializer};`));

  for (const rule of rules) {
    lines.push("");
    const res = convertRule(aggregate, ctx, rule, lines);
    if(isCodyError(res)) {
      return res;
    }
  }

  lines.push("");

  return lines.join("\n  ");
}

const convertRule = (aggregate: Node, ctx: Context, rule: Rule, lines: string[]): boolean | CodyResponse => {
  switch (rule.rule) {
    case "always":
      return convertAlwaysRule(aggregate, ctx, rule, lines);
    default:
      return {
        cody: `I don't know how to handle a rule of type "${rule.rule}".`,
        type: CodyResponseType.Error,
        details: `Looks like a typo on your side. I can handle the following rule types: always, condition, validate`
      }
  }
}

const convertAlwaysRule = (aggregate: Node, ctx: Context, rule: AlwaysRule, lines: string[]): boolean | CodyResponse => {
  return convertThen(aggregate, ctx, rule, lines);
}

const convertThen = (aggregate: Node, ctx: Context, rule: Rule, lines: string[]): boolean | CodyResponse => {
  const {then} = rule;
  switch (then.do) {
    case "record_event":
      return convertThenRecordEvent(aggregate, ctx, then as ThenRecordEvent, rule, lines);
    default:
      return {
        cody: `I don't know the "then.do" part of that rule: ${JSON.stringify(rule)}.`,
        type: CodyResponseType.Error,
        details: `Looks like a typo on your side. I can only perform the actions: record_event, throw_error, assign_variable, trigger_command, perform_query`,
      }
  }
}

const convertThenRecordEvent = (aggregate: Node, ctx: Context, then: ThenRecordEvent, rule: Rule, lines: string[], indent = ''): boolean | CodyResponse => {
  const aggregateNames = names(aggregate.getName());
  const service = detectService(aggregate, ctx);
  if(isCodyError(service)) {
    return service;
  }

  const eventNameParts = then.event.split(".");
  const eventNames = names(then.event);

  if(eventNameParts.length > 1) {
    return {
      cody: `Please don't use a dot in the event name of a record_event rule. I found one in the rule: ${JSON.stringify(rule)} of aggregate "${aggregate.getName()}"`,
      type: CodyResponseType.Error,
      details: `You don't have to provide the full event name including service and aggregate. I'm using service "${service}" and aggregate name: "${aggregate.getName()}" for that event.`
    }
  }

  const events = getTargetsOfType(aggregate, NodeType.event, true);
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
      cody: `The event "${then.event}" specified in the rule: ${JSON.stringify(rule)} of aggregate "${aggregate.getName()}" is not known for that aggregate`,
      type: CodyResponseType.Error,
      details: `An aggregate can only record events that are connected to it with an arrow pointing from the aggregate to the event.`
    }
  }

  const mapping = convertMapping(aggregate, ctx, then.mapping, rule);
  if(isCodyError(mapping)) {
    return mapping;
  }

  lines.push(`${indent}yield ${eventNames.propertyName}(${mapping});`);
}

const convertMapping = (aggregate: Node, ctx: Context, mapping: string | PropMapping, rule: Rule): string | CodyResponse => {
  if(typeof mapping === "string") {
    return wrapExpression(mapping);
  }

  let propMap = "{ ";

  for (const propName in mapping) {
    propMap += `"${propName}": ${wrapExpression(mapping[propName])},`
  }

  propMap += " }";

  return propMap;
}

const wrapExpression = (expr: string): string => {
  return `await jexl.eval("${expr}", ctx)`;
}
