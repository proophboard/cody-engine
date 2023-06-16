import {FromSchema} from "json-schema-to-ts";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {CommandRuntimeInfo, makeCommand} from "@event-engine/messaging/command";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {AddCarToFleetSchema} from "@app/shared/commands/fleet-management/add-car-to-fleet.schema";
import {AddCarToFleetDesc} from "@app/shared/commands/fleet-management/add-car-to-fleet.desc";
import {AddCarToFleetUiSchema} from "@app/shared/commands/fleet-management/add-car-to-fleet.ui-schema";

export type AddCarToFleet = DeepReadonly<FromSchema<
  typeof AddCarToFleetSchema,
  {references: references}
  >>;

export const addCarToFleet = makeCommand<AddCarToFleet>(
  AddCarToFleetDesc.name,
  AddCarToFleetSchema as Writable<typeof AddCarToFleetSchema>,
  definitions
);

export const FleetManagementAddCarToFleetRuntimeInfo: CommandRuntimeInfo = {
  desc: AddCarToFleetDesc,
  factory: addCarToFleet,
  schema: AddCarToFleetSchema,
  uiSchema: AddCarToFleetUiSchema,
}
