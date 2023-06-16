import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {EventRuntimeInfo, makeEvent} from "@event-engine/messaging/event";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {IncompleteCarAddedDesc} from "@app/shared/events/fleet-management/car/incomplete-car-added.desc";
import {IncompleteCarAddedSchema} from "@app/shared/events/fleet-management/car/incomplete-car-added.schema";

export type IncompleteCarAdded = DeepReadonly<FromSchema<
  typeof IncompleteCarAddedSchema,
  {references: references}
  >>;

export const incompleteCarAdded = makeEvent<IncompleteCarAdded>(
  IncompleteCarAddedDesc.name,
  IncompleteCarAddedSchema as Writable<typeof IncompleteCarAddedSchema>,
  definitions
);

export const FleetManagementCarIncompleteCarAddedRuntimeInfo: EventRuntimeInfo = {
  desc: IncompleteCarAddedDesc,
  factory: incompleteCarAdded,
  schema: IncompleteCarAddedSchema,
}
