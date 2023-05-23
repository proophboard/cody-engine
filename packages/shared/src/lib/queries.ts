import { QueryRuntimeInfo } from "@event-engine/messaging/query";
import { FleetManagementGetCarQueryRuntimeInfo } from "@app/shared/queries/fleet-management/get-car";
import { FleetManagementGetCarListQueryRuntimeInfo } from "@app/shared/queries/fleet-management/get-car-list";

type QueryRegistry = { [queryName: string]: QueryRuntimeInfo };

export const queries: QueryRegistry = {
  "FleetManagement.GetCar": FleetManagementGetCarQueryRuntimeInfo,
  "FleetManagement.GetCarList": FleetManagementGetCarListQueryRuntimeInfo
}
