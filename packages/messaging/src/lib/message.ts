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
