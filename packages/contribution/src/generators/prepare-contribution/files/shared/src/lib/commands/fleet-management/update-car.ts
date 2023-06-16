import {FromSchema} from "json-schema-to-ts";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {CommandRuntimeInfo, makeCommand} from "@event-engine/messaging/command";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {UpdateCarSchema} from "@app/shared/commands/fleet-management/update-car.schema";
import {UpdateCarDesc} from "@app/shared/commands/fleet-management/update-car.desc";

export type UpdateCar = DeepReadonly<FromSchema<
  typeof UpdateCarSchema,
  {references: references}
  >>;

export const updateCar = makeCommand<UpdateCar>(
  UpdateCarDesc.name,
  UpdateCarSchema as Writable<typeof UpdateCarSchema>,
  definitions
);

export const FleetManagementUpdateCarRuntimeInfo: CommandRuntimeInfo = {
  desc: UpdateCarDesc,
  factory: updateCar,
  schema: UpdateCarSchema,
}
