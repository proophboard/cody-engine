import { Message, Payload, Meta } from './message';
import {JSONSchema7} from "json-schema";
import {ajv} from "@event-engine/messaging/configuredAjv";
import {ValidationError} from "ajv";
import {cloneSchema, resolveRefs} from "@event-engine/messaging/resolve-refs";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {addInstanceNameToError} from "@event-engine/messaging/add-instance-name-to-error";
import {QueryDescription} from "@event-engine/descriptions/descriptions";
import {v4 as uuidv4} from 'uuid';

export interface QueryRuntimeInfo<P extends Payload = any, M extends Meta = any> {
  desc: QueryDescription;
  factory: ReturnType<typeof makeQuery<P, M>>;
  schema: DeepReadonly<JSONSchema7>;
}

export type Query<P extends Payload = any, M extends Meta = any> = Message<
  P,
  M
  >;

export const makeQuery = <P extends Payload, M extends Meta = any>(
  name: string,
  schema: JSONSchema7,
  definitions: {[id: string]: DeepReadonly<JSONSchema7>}
): ((payload: P, meta?: M) => Query<P,M>) => {
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

  const func = (payload: Partial<P>, meta?: M, uuid?: string, createdAt?: Date): Query<P,M> => {
    return {
      uuid: uuid || uuidv4(),
      name,
      payload: validator(payload),
      meta: meta || ({} as M),
      createdAt: createdAt || new Date(),
    };
  };

  func.toString = () => name;

  return func;
};

export type QueryResolver<S extends Payload = any> = (query: Query<S>) => Promise<S>;
export type QueryResolverWithDependencies<S extends Payload = any, D = any> = (query: Query<S>, dependencies: D) => Promise<S>;
export type QueryResolverRegistry = {[queryName: string]: QueryResolver<any> | QueryResolverWithDependencies<any, any>};
