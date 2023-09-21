import {PlayEventRuntimeInfo, PlaySchemaDefinitions} from "@cody-play/state/types";
import {makeEvent} from "@event-engine/messaging/event";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import {JSONSchema7} from "json-schema";

export const makeEventFactory = (event: PlayEventRuntimeInfo, definitions: PlaySchemaDefinitions): ReturnType<typeof makeEvent<any, any>> => {
  return makeEvent(
    event.desc.name,
    event.schema as Writable<JSONSchema7>,
    definitions
  )
}
