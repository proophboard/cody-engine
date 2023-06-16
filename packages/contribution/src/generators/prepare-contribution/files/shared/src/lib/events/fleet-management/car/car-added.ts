import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {EventRuntimeInfo, makeEvent} from "@event-engine/messaging/event";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {CarAddedDesc} from "@app/shared/events/fleet-management/car/car-added.desc";
import {CarAddedSchema} from "@app/shared/events/fleet-management/car/car-added.schema";

export type CarAdded = DeepReadonly<FromSchema<
  typeof CarAddedSchema,
  {references: references}
  >>;

export const carAdded = makeEvent<CarAdded>(
  CarAddedDesc.name,
  CarAddedSchema as Writable<typeof CarAddedSchema>,
  definitions
);

export const FleetManagementCarCarAddedRuntimeInfo: EventRuntimeInfo = {
  desc: CarAddedDesc,
  factory: carAdded,
  schema: CarAddedSchema,
}
