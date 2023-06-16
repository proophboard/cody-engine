import {DeepReadonly} from "json-schema-to-ts/lib/types/type-utils/readonly";
import {FromSchema} from "json-schema-to-ts";
import {makeQuery, QueryRuntimeInfo} from "@event-engine/messaging/query";
import {Writable} from "json-schema-to-ts/lib/types/type-utils";
import definitions from "@app/shared/types/definitions";
import {references} from "@app/shared/types/references";
import {GetCarListSchema} from "@app/shared/queries/fleet-management/get-car-list.schema";
import {GetCarListDesc} from "@app/shared/queries/fleet-management/get-car-list.desc";

export type GetCarList = DeepReadonly<FromSchema<
  typeof GetCarListSchema,
  {references: references}
  >>;

export const getCarList = makeQuery<GetCarList>(
  GetCarListDesc.name,
  GetCarListSchema as Writable<typeof GetCarListSchema>,
  definitions
);

export const FleetManagementGetCarListQueryRuntimeInfo: QueryRuntimeInfo = {
  desc: GetCarListDesc,
  factory: getCarList,
  schema: GetCarListSchema,
}
