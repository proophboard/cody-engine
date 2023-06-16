import { QueryResolverRegistry } from "@event-engine/messaging/query";
import { resolveGetCar as resolveFleetManagementGetCar } from "@server/query-resolvers/fleet-management/resolve-get-car";
import { resolveGetCarList as resolveFleetManagementGetCarList } from "@server/query-resolvers/fleet-management/resolve-get-car-list";

export const queryResolvers: QueryResolverRegistry = {
  "FleetManagement.GetCar": resolveFleetManagementGetCar,
  "FleetManagement.GetCarList": resolveFleetManagementGetCarList
}
