import {JSONSchema7} from "json-schema";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";

export type Payload = { readonly [k: string]: any };
export type Meta = { readonly [k: string]: any };

export interface Message<P extends Payload = any, M extends Meta = any> {
  readonly uuid: string;
  readonly name: string;
  readonly payload: P;
  readonly createdAt: Date;
  readonly meta: M;
}

export const messageFromJSON = <P extends Payload, M extends Meta>(message: object): Message<P, M> => {
  // @TODO validate message object
  return {
    ...message as Message,
    createdAt: new Date(Date.parse((message as {createdAt: string}).createdAt)),
  }
}

export const messageToJSON = (message: Message): object => {
  return {
    ...message,
    createdAt: message.createdAt.toJSON()
  }
}

export const setMessageMetadata = <P extends Payload, M extends Meta>(
  msg: Message<P, M>,
  key: keyof M,
  val: M[keyof M],
): Message<P, M> => {
  const { meta } = msg;

  const changedMeta = { ...meta };

  changedMeta[key] = val;

  return {
    ...msg,
    meta: changedMeta,
  };
};

export const enforceUndefinedProperties = <P extends Payload>(payload: P, schema: DeepReadonly<JSONSchema7>): P => {
  if(schema.type !== "object" || typeof schema.properties === "undefined") {
    return payload;
  }

  const props = Object.keys(schema.properties);
  const requiredProps = schema.required || [];

  const optionalProps = props.filter(prop => !requiredProps.includes(prop));
  const normalizedPayload: {[prop: string]: any} = {...payload};

  optionalProps.forEach(oProp => {
    if(typeof payload[oProp] === "undefined") {
      normalizedPayload[oProp] = undefined;
    }
  })

  return normalizedPayload as P;
}

export const cleanUndefinedProperties = <P extends Payload>(payload: P): P => {
  if(typeof payload !== "object") {
    return payload;
  }

  const cleanedPayload: {[prop: string]: any} = {};

  for (const payloadKey in payload) {
    if(typeof payload[payloadKey] !== "undefined") {
      cleanedPayload[payloadKey] = payload[payloadKey];
    }
  }

  return cleanedPayload as P;
}
