import {PlayQueryRuntimeInfo, PlaySchemaDefinitions} from "@cody-play/state/types";
import {makeQuery} from "@event-engine/messaging/query";
import {JSONSchema7} from "json-schema";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";

export const makeQueryFactory = (query: PlayQueryRuntimeInfo, definitions: PlaySchemaDefinitions): ReturnType<typeof makeQuery<any, any>> => {
  return makeQuery(
    query.desc.name,
    query.schema as Writable<JSONSchema7>,
    definitions
  )
}
