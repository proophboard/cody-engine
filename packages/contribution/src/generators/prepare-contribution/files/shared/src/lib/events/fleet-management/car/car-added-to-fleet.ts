import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {EventRuntimeInfo, makeEvent} from "@event-engine/messaging/event";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {CarAddedToFleetDesc} from "@app/shared/events/fleet-management/car/car-added-to-fleet.desc";
import {CarAddedToFleetSchema} from "@app/shared/events/fleet-management/car/car-added-to-fleet.schema";

export type CarAddedToFleet = DeepReadonly<FromSchema<
  typeof CarAddedToFleetSchema,
  {references: references}
  >>;

export const carAddedToFleet = makeEvent<CarAddedToFleet>(
  CarAddedToFleetDesc.name,
  CarAddedToFleetSchema as Writable<typeof CarAddedToFleetSchema>,
  definitions
);

export const FleetManagementCarCarAddedToFleetRuntimeInfo: EventRuntimeInfo = {
  desc: CarAddedToFleetDesc,
  factory: carAddedToFleet,
  schema: CarAddedToFleetSchema,
}
