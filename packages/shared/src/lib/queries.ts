import {QueryRuntimeInfo} from "@event-engine/messaging/query";
import {FleetManagementGetCarQueryRuntimeInfo} from "@app/shared/queries/fleet-management/get-car";

type QueryRegistry = {[queryName: string]: QueryRuntimeInfo};

export const queries: QueryRegistry = {
  "FleetManagement.GetCar": FleetManagementGetCarQueryRuntimeInfo,
}
