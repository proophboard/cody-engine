import {PlayCommandRuntimeInfo, PlaySchemaDefinitions} from "@cody-play/state/types";
import {makeCommand} from "@event-engine/messaging/command";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import {JSONSchema7} from "json-schema";

export const makeCommandFactory = (command: PlayCommandRuntimeInfo, definitions: PlaySchemaDefinitions): ReturnType<typeof makeCommand<any, any>> => {
  return makeCommand(
    command.desc.name,
    command.schema as Writable<JSONSchema7>,
    definitions
  );
};
