import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {EventRuntimeInfo, makeEvent} from "@event-engine/messaging/event";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {CarUpdatedDesc} from "@app/shared/events/fleet-management/car/car-updated.desc";
import {CarUpdatedSchema} from "@app/shared/events/fleet-management/car/car-updated.schema";

export type CarUpdated = DeepReadonly<FromSchema<
  typeof CarUpdatedSchema,
  {references: references}
  >>;

export const carUpdated = makeEvent<CarUpdated>(
  CarUpdatedDesc.name,
  CarUpdatedSchema as Writable<typeof CarUpdatedSchema>,
  definitions
);

export const FleetManagementCarCarUpdatedRuntimeInfo: EventRuntimeInfo = {
  desc: CarUpdatedDesc,
  factory: carUpdated,
  schema: CarUpdatedSchema,
}
