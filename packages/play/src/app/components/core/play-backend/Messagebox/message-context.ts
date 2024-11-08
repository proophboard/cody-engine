import {JSONSchema7} from "json-schema";
import {ResolveConfig} from "@cody-play/infrastructure/cody/vo/play-vo-metadata";
import {PlayEventPolicyDescription, PlayInformationRegistry} from "@cody-play/state/types";
import {CodyPlayConfig} from "@cody-play/state/config-store";
import {User} from "@app/shared/types/core/user/user";
import {v4} from "uuid";
import {DependencyRegistry} from "@event-engine/descriptions/descriptions";
import {AnyRule} from "@cody-engine/cody/hooks/rule-engine/configuration";
import {PlayMessageType} from "@cody-play/infrastructure/cody/dependencies/play-load-dependencies";
import {playFQCNFromDefinitionId} from "@cody-play/infrastructure/cody/schema/play-definition-id";

type PlayEventPolicyRegistry = {
  [policyName: string]: PlayEventPolicyDescription
}

export interface MessageContext {
  type: PlayMessageType;
  messageId: string;
  messageName: string;
  createdAt: string;
  meta: Record<string, any>;
}

export interface QueryContext extends MessageContext {
  type: "query";
  query: any;
  dependencies: DependencyRegistry;
  resolve: ResolveConfig;
}

export const isQueryContext = (msgCtx: MessageContext): msgCtx is QueryContext => {
  return msgCtx.type === "query";
}

export interface CommandContext extends MessageContext {
  type: "command";
  command: any;
  dependencies: DependencyRegistry;
  rules: AnyRule[];
}

export const isCommandContext = (msgCtx: MessageContext): msgCtx is CommandContext => {
  return msgCtx.type === "command";
}

export interface EventContext extends MessageContext {
  type: "event";
  event: any;
  projections: PlayEventPolicyRegistry;
  policies: PlayEventPolicyRegistry;
}

export const isEventContext = (msgCtx: MessageContext): msgCtx is EventContext => {
  return msgCtx.type === "event";
}

export const getMessageContext = (messageName: string, type: PlayMessageType, config: CodyPlayConfig, user: User): MessageContext => {
  switch (type) {
    case "command":
      return getCommandContext(messageName, config, user);
    case "event":
      return getEventContext(messageName, config, user);
    case "query":
      return getQueryContext(messageName, config, user);
  }
}

const getCommandContext = (commandName: string, config: CodyPlayConfig, user: User): CommandContext => {
  const msgCtx = getMessageAttributes(commandName, "command", user);

  const runtimeInfo = config.commands[commandName];
  const handler = config.commandHandlers[commandName];

  return {
    command: convertJsonSchemaToExamplePayload(runtimeInfo.schema as JSONSchema7, config.types),
    meta: msgCtx.meta,
    dependencies: runtimeInfo.desc.dependencies || {},
    rules: handler,
    messageId: msgCtx.messageId,
    messageName: msgCtx.messageName,
    createdAt: msgCtx.createdAt,
    type: "command",
  }
}

const getQueryContext = (queryName: string, config: CodyPlayConfig, user: User): QueryContext => {
  const msgCtx = getMessageAttributes(queryName, "query", user);

  const runtimeInfo = config.queries[queryName];

  const resolve = config.resolvers[queryName];

  return {
    query: convertJsonSchemaToExamplePayload(runtimeInfo.schema as JSONSchema7, config.types),
    meta: msgCtx.meta,
    dependencies: runtimeInfo.desc.dependencies || {},
    resolve,
    messageId: msgCtx.messageId,
    messageName: msgCtx.messageName,
    createdAt: msgCtx.createdAt,
    type: "query",
  }
}

const getEventContext = (eventName: string, config: CodyPlayConfig, user: User): EventContext => {
  const msgCtx = getMessageAttributes(eventName, "event", user);

  const runtimeInfo = config.events[eventName];

  const evtListeners = config.eventPolicies[eventName];

  const projections: PlayEventPolicyRegistry = {};
  const policies: PlayEventPolicyRegistry = {};

  for (const listenerName in evtListeners) {
    const config = evtListeners[listenerName];

    if(config.projection) {
      projections[listenerName] = config;
    } else {
      policies[listenerName] = config;
    }
  }

  return {
    event: convertJsonSchemaToExamplePayload(runtimeInfo.schema as JSONSchema7, config.types),
    meta: msgCtx.meta,
    policies,
    projections,
    messageId: msgCtx.messageId,
    messageName: msgCtx.messageName,
    createdAt: msgCtx.createdAt,
    type: "event",
  }
}

const getMessageAttributes = (messageName: string, type: PlayMessageType, user: User): MessageContext => {
  return {
    meta: {
      user,
    },
    messageId: v4(),
    messageName,
    type,
    createdAt: (new Date()).toISOString()
  }
}

const convertJsonSchemaToExamplePayload = (schema: JSONSchema7, types: PlayInformationRegistry): any => {
  if(schema.$ref) {
    return convertRefSchemaToExamplePayload(schema, types);
  }

  if(schema.oneOf) {
    return convertJsonSchemaToExamplePayload(schema.oneOf[0] as JSONSchema7 || {}, types)
  }

  if(schema.anyOf) {
    return convertJsonSchemaToExamplePayload(schema.anyOf[0] as JSONSchema7 || {}, types)
  }

  if(schema.type) {
    switch (schema.type) {
      case "object":
        return convertObjectSchemaToExamplePayload(schema, types);
      case "array":
        return convertArraySchemaToExamplePayload(schema, types);
      case "string":
        return convertStringSchemaToExamplePayload(schema, types);
      case "integer":
      case "number":
        return convertNumberSchemaToExamplePayload(schema, types);
      case "boolean":
        return convertBooleanSchemaToExamplePayload(schema, types);
      case "null":
        return null;
    }
  }

  return {};
}

const convertRefSchemaToExamplePayload = (schema: JSONSchema7, types: PlayInformationRegistry): any => {
  const fqcn = playFQCNFromDefinitionId(schema.$ref || '');

  const info = types[fqcn];

  const resolvedSchema = info ? info.schema : {};

  return convertJsonSchemaToExamplePayload(resolvedSchema as JSONSchema7, types);
}

const convertObjectSchemaToExamplePayload = (schema: JSONSchema7, types: PlayInformationRegistry): any => {
  const props: Record<any, any> = {};

  const properties = schema.properties || {};

  for (const prop in properties) {
    props[prop] = convertJsonSchemaToExamplePayload(properties[prop] as JSONSchema7, types);
  }

  return props;
}

const convertArraySchemaToExamplePayload = (schema: JSONSchema7, types: PlayInformationRegistry): any => {
  const item = convertJsonSchemaToExamplePayload(schema.items as JSONSchema7 || {}, types);

  return [
    item,
  ]
}

const convertStringSchemaToExamplePayload = (schema: JSONSchema7, types: PlayInformationRegistry): string => {
  if(typeof schema.default !== "undefined") {
    return schema.default as string;
  }

  if(schema.enum) {
    return schema.enum[0] as string || ''
  }

  if(schema.format) {
    switch (schema.format) {
      case "uuid":
        return v4();
      case "email":
        return "info@example.com";
      case "date":
        return (new Date()).toDateString();
      case "time":
        return (new Date()).toTimeString();
      case "datetime":
        return (new Date()).toISOString();
      default:
        return "string";
    }
  }

  return "string";
}

const convertNumberSchemaToExamplePayload = (schema: JSONSchema7, types: PlayInformationRegistry): number => {
  if(typeof schema.default !== "undefined") {
    return schema.default as number;
  }

  if(schema.enum) {
    return schema.enum[0] as number || 0;
  }

  if(schema.minimum) {
    return schema.minimum as number;
  }

  return 0;
}

const convertBooleanSchemaToExamplePayload = (schema: JSONSchema7, types: PlayInformationRegistry): boolean => {
  if(typeof schema.default !== "undefined") {
    return schema.default as boolean;
  }

  return true;
}
