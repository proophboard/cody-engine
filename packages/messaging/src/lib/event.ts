import { Message, Payload, Meta } from './message';
import {JSONSchema7} from "json-schema";
import {ajv} from "@event-engine/messaging/configuredAjv";
import {ValidationError} from "ajv";
import {cloneSchema, resolveRefs} from "@event-engine/messaging/resolve-refs";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {addInstanceNameToError} from "@event-engine/messaging/add-instance-name-to-error";
import {AggregateEventDescription, EventDescription} from "@event-engine/descriptions/descriptions";
import {v4 as uuidv4} from 'uuid';

export interface EventRuntimeInfo<P extends Payload = any, M extends EventMeta = any> {
  desc: EventDescription | AggregateEventDescription;
  factory: ReturnType<typeof makeEvent<P,M>>;
  schema: DeepReadonly<JSONSchema7>;
}

export type EventVisibility = "public" | "service" | "archive";

export type EventMeta = Meta & {visibility: EventVisibility, version: string}

export type Event<P extends Payload = any, M extends EventMeta = any> = Message<
  P,
  M
  >;

export type EventFactory<P extends Payload, M extends EventMeta = any> = (payload: P, meta?: M) => Event<P,M>;
export type EventMapperFactory<IP extends Payload, OP extends Payload, M extends EventMeta = any> = (payload: IP, meta?: M) => Event<OP,M>;

export const makeEvent = <P extends Payload, M extends EventMeta = any>(
  name: string,
  schema: JSONSchema7,
  definitions: {[id: string]: DeepReadonly<JSONSchema7>},
  isPublic?: boolean,
  version = 'v1'
): EventFactory<P,M> => {
  schema = resolveRefs(cloneSchema(schema), definitions);
  if(schema.$id) {
    ajv.removeSchema(schema.$id);
  }
  const validate = ajv.compile(schema);
  const validator = (payload: unknown): P => {
    if (!validate(payload)) {
      if (validate.errors) {
        throw new ValidationError(validate.errors.map(e => addInstanceNameToError(e, name)));
      } else {
        throw new Error(`Validation for "${name}" failed for unknown reason.`);
      }
    }

    return payload as P;
  };

  const func = (payload: Partial<P>, meta?: M, uuid?: string, createdAt?: Date): Event<P,M> => {
    if(!meta) {
      meta = {} as M;
    }

    meta = {
      visibility: isPublic? "public" : "service",
      version,
      ...meta as Omit<M, "visibility">
    } as M;

    return {
      uuid: uuid || uuidv4(),
      name,
      payload: validator(payload),
      meta: meta,
      createdAt: createdAt || new Date(),
    };
  };

  func.toString = () => name;

  return func;
};

export type WithPublish = Event & { toPublicEvent: () => Event };

export const withPublish = <P extends Payload, M extends EventMeta = any, OP extends Payload = any>(event: Event<P,M>, factory: EventFactory<P, M> | EventMapperFactory<P, OP, M>): WithPublish => {
  return {
    ...event,
    toPublicEvent: function () {
      return factory(this.payload, {...this.meta, visibility: "public"});
    }
  }
}

export const providesPublicEvent = (event: Event & {toPublicEvent?: () => Event}): event is WithPublish => {
  return typeof event['toPublicEvent'] !== 'undefined';
}
