import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {makeQuery, QueryRuntimeInfo} from "@event-engine/messaging/query";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {GetCarSchema} from "@app/shared/queries/fleet-management/get-car.schema";
import {GetCarDesc} from "@app/shared/queries/fleet-management/get-car.desc";

export type GetCar = DeepReadonly<FromSchema<
  typeof GetCarSchema,
  {references: references}
  >>;

export const getCar = makeQuery<GetCar>(
  GetCarDesc.name,
  GetCarSchema as Writable<typeof GetCarSchema>,
  definitions
);

export const FleetManagementGetCarQueryRuntimeInfo: QueryRuntimeInfo = {
  desc: GetCarDesc,
  factory: getCar,
  schema: GetCarSchema,
}
